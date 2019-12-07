from rest_framework import serializers
from .models import Message, Chat
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('id', 'username')


class ChatSerializer(serializers.ModelSerializer):
	users = UserSerializer(many=True, required=False, read_only=True)
	class Meta:
		model = Chat
		fields = ('id', 'title', 'users')

class MessageSerializer(serializers.ModelSerializer):
	author = UserSerializer(required=False)
	read = UserSerializer(many=True, required=False)
	class Meta:
		model = Message
		fields = ('id', 'text', 'type', 'date', 'author', 'chat', 'read', 'img')

