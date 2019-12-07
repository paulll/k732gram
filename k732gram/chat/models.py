from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Chat(models.Model):
	id = models.AutoField(primary_key=True, blank=True)
	title = models.CharField(max_length=256)
	users = models.ManyToManyField(User)

	def __str__(self):
		return "chat '"+ self.title + "'"

class Message(models.Model):
	id = models.AutoField(primary_key=True, blank=True)
	type = models.CharField(max_length=16, blank=True)
	text = models.TextField(blank=True, null=True)
	img = models.ImageField(blank=True, null=True)
	date = models.DateTimeField(auto_now_add=True, blank=True)
	author = models.ForeignKey(User, blank=True, on_delete=models.CASCADE, related_name="%(app_label)s_%(class)s_author")
	chat = models.ForeignKey(Chat, on_delete=models.PROTECT)
	read = models.ManyToManyField(User, related_name="%(app_label)s_%(class)s_readby", blank=True, null=True)

	def __str__(self):
		if self.text:
			return "msg '" + self.text + "' by " + str(self.author)
		return "msg#" +self.type + ' by ' + str(self.author)