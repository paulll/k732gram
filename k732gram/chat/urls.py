from django.urls import include, path
from rest_framework import routers
from . import views
from django.views.decorators.csrf import csrf_exempt

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('sendText', views.SendTextView.as_view()),
    path('sendImg', views.SendImgView.as_view()),
    path('sendSticker', views.SendStickerView.as_view()),
    path('getChats', views.GetChatsView.as_view()),
    path('getChatHistory', views.GetChatHistoryView.as_view()),
    path('getCentrifugoToken', views.GetCentrifugoTokenView.as_view()),
    path('getSubscription',  csrf_exempt(views.GetSubscriptionView.as_view())),
    path('getSelf', views.GetSelfView.as_view()),
    path('markAsRead', views.MarkAsReadView.as_view()),
    
    path('createChat', views.CreateChatView.as_view()),
    path('getUsers', views.GetUsersView.as_view()),
    path('addChatMember', views.AddChatMemberView.as_view()),
    path('rmChatMember', views.RmChatMemberView.as_view())
    #path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
