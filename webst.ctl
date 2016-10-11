#
# Тестовый контент для Web-сервера с использованием модуля HTROM
#
#___________________________________________________________________________
#
# Тестирование извлечения простого файла без дополнительных аттрибутов
#

Name=index.html
Location=dwl.htm

Name=proc.html
File=proc.html
Content-Type=text/html;charset=utf-8
Cache-Control=max-age=2592000, stale-while-revalidate=864000


Name=dwl.htm
File=dwl.htm
Content-Type=text/html;charset=utf-8
Cache-Control=max-age=600


Name=base.js
File=base.js
Content-Type=text/javascript
Cache-Control=max-age=2592000, stale-while-revalidate=864000

Name=cgi/tbl
File=tbl.json
Content-Type=text/json
Cache-Control=max-age=600

Name=desc
File=desc.json
Content-Type=text/json
Cache-Control=max-age=600

Name=dwl.html
Location=dwl.htm




