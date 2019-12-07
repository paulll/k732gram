#
#  Lasciate ogni speranza, voi ch'entrate
#

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication
from rest_framework.pagination import CursorPagination
from rest_framework.authentication import SessionAuthentication 
from django.contrib.auth.models import User

from cent import Client
import json, os, jwt

from ..settings import BASE_DIR
from .serializers import MessageSerializer, ChatSerializer, UserSerializer
from .models import Message, Chat


cf_file = open(os.path.join(BASE_DIR, 'config/centrifugo.json'))
cf = json.load(cf_file)
centrifuge = Client("http://centrifugo:8000", api_key=cf['api_key'])
cf_file.close()

def check_user_access(request, chatId):
	if request.user.is_staff:
		return True
	chat = Chat.objects.get(id=chatId)
	return chat.users.filter(id=request.user.id).exists()



class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


class CursorSetPagination(CursorPagination):
    page_size = 200
    page_size_query_param = 'count'
    ordering = '-date' # '-creation' is default

#
# Admin methods
#
class CreateChatView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not request.user.is_staff:
			return Response(0, status=status.HTTP_403_FORBIDDEN)
		serialier = ChatSerializer(data=request.data)
		if serialier.is_valid():
			chat = serialier.save(users=[request.user])
			return Response(ChatSerializer(chat).data, status=status.HTTP_200_OK)
		return Response(serialier.errors, status=status.HTTP_400_BAD_REQUEST)	

class GetUsersView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def get(self, request, format=None):
		if not request.user.is_staff:
			return Response(0, status=status.HTTP_403_FORBIDDEN)
		return Response(UserSerializer(User.objects, many=True).data, status=status.HTTP_200_OK)	

class AddChatMemberView(APIView):
	def post(self, request, format=None):
		if not request.user.is_staff:
			return Response(0, status=status.HTTP_403_FORBIDDEN)
		try:	
			chat = Chat.objects.get(id=request.data['chat'])
			user = User.objects.get(id=request.data['id'])
			chat.users.add(user)

			msg = Message(**{
				'type': 'userJoined',
				'author': user,
				'chat': chat
			})
			msg.save()
			msg.read.set([request.user])
			data = MessageSerializer(msg).data
			centrifuge.publish("$chat-{}".format(request.data['chat']), {'data':data, 'type': 'newMessage'})
		except (Chat.DoesNotExist, User.DoesNotExist) as e:
			return Response("chat or user does not exist", status=status.HTTP_400_BAD_REQUEST)
		return Response(True, status=status.HTTP_200_OK)

class RmChatMemberView(APIView):
	def post(self, request, format=None):
		if not request.user.is_staff:
			return Response(0, status=status.HTTP_403_FORBIDDEN)
		try:	
			chat = Chat.objects.get(id=request.data['chat'])
			user = User.objects.get(id=request.data['id'])
			chat.users.remove(user)

			msg = Message(**{
				'type': 'userLeft',
				'author': user,
				'chat': chat
			})
			msg.save()
			msg.read.set([request.user])
			data = MessageSerializer(msg).data
			centrifuge.publish("$chat-{}".format(request.data['chat']), {'data':data, 'type': 'newMessage'})
		except (Chat.DoesNotExist, User.DoesNotExist) as e:
			return Response("chat or user does not exist", status=status.HTTP_400_BAD_REQUEST)
		return Response(True, status=status.HTTP_200_OK)

#
# API
#


class GetSelfView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def get(self, request, format=None):
		return Response({
			**UserSerializer(request.user).data, 
			'admin': request.user.is_staff
		}, status=status.HTTP_200_OK)


class SendTextView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not check_user_access(request, request.data['chat']):
			return Response(token, status=status.HTTP_403_FORBIDDEN)

		serializer = MessageSerializer(data=request.data)
		if serializer.is_valid() and 'text' in serializer.validated_data:
			msg = serializer.save(author=request.user, type='text')
			data = MessageSerializer(msg).data
			centrifuge.publish("$chat-{}".format(request.data['chat']), {'data':data, 'type': 'newMessage'})
			return Response(data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SendImgView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not check_user_access(request, request.data['chat']):
			return Response(token, status=status.HTTP_403_FORBIDDEN)

		serializer = MessageSerializer(data=request.data)
		if serializer.is_valid() and 'img' in serializer.validated_data:
			msg = serializer.save(author=request.user, type='img')
			data = MessageSerializer(data=msg.data).data
			centrifuge.publish("$chat-{}".format(request.data['chat']), {'data':data, 'type': 'newMessage'})
			return Response(data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)		

class SendStickerView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not check_user_access(request, request.data['chat']):
			return Response(token, status=status.HTTP_403_FORBIDDEN)	

		serializer = MessageSerializer(data=request.data)
		if serializer.is_valid() and 'img' in serializer.validated_data and not 'text' in serializer.validated_data:
			msg = serializer.save(author=request.user, type='sticker')
			data = MessageSerializer(data=msg.data).data
			centrifuge.publish("$chat-{}".format(request.data['chat']), {'data':data, 'type': 'newMessage'})
			return Response(data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetChatsView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def get(self, request, format=None):
		chats = request.user.chat_set.all()
		if request.user.is_staff:
			chats = Chat.objects;
		chats_serialized = ChatSerializer(chats, many=True, read_only=True)
		return Response(chats_serialized.data, status=status.HTTP_200_OK)

class GetChatHistoryView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not request.user.is_staff and not check_user_access(request, request.data['id']):
			return Response("not a member", status=status.HTTP_403_FORBIDDEN)	

		chat = Chat.objects.get(id=request.data['id'])
		messages = chat.message_set
		paginator = CursorSetPagination()
		result_page = paginator.paginate_queryset(messages, request)
		serializer = MessageSerializer(result_page, many=True, read_only=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

class GetSubscriptionView(APIView):
	authentication_classes = [CsrfExemptSessionAuthentication]
	def post(self, request, format=None):
		clientId = request.data['client']
		chats = request.data['channels'] # $chat-{id}
		results = []
		for chat in chats:
			chatId = int(chat.split('-')[-1])
			if not check_user_access(request, chatId):
				return Response(token, status=status.HTTP_403_FORBIDDEN)
			token = jwt.encode({
				"client": clientId,
				"channel": "$chat-{}".format(chatId)
			}, cf['secret'], algorithm="HS256").decode()	
			results.append({
				"channel": chat,
				"token": token
			})
		return Response({"channels": results}, status=status.HTTP_200_OK)

class MarkAsReadView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def post(self, request, format=None):
		if not check_user_access(request, request.data['chat']):
			return Response(token, status=status.HTTP_403_FORBIDDEN)
		print(request.data)	
		messages = Chat.objects.get(id=request.data['chat']).message_set.filter(id__lte=request.data['id'])
		request.user.chat_message_readby.add(*messages)
		centrifuge.publish("$chat-{}".format(request.data['chat']), {
			'data': {
				'ids': list((message.id for message in messages)),
				'by': UserSerializer(request.user).data,
			},
			'type': 'readMessage'
		})
		return Response(len(messages), status=status.HTTP_200_OK)	

class GetCentrifugoTokenView(APIView):
	authentication_classes = [authentication.SessionAuthentication]
	def get(self, request, format=None):
		token = jwt.encode({"sub": str(request.user.id)}, cf['secret']).decode()
		return Response(token, status=status.HTTP_200_OK)
