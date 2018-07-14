FROM microsoft/dotnet:2.1-aspnetcore-runtime
WORKDIR /var/www
COPY pub .
VOLUME /var/www/diary_images
EXPOSE 51407
ENTRYPOINT ["dotnet", "Diary.dll"]
