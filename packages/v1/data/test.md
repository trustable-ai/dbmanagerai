# test

$  ops ide deploy v1/data
$ ops invoke v1/data _op=destroy
require parameters

$ ops invoke v1/data _op=destroy do-i-know-i-lose-data='yes' __ow_method=get
not allowed

$ ops invoke v1/data _op=destroy do-i-know-i-lose-data='yes'
ok

$ ops invoke v1/data _op=destroy do-i-know-i-lose-data='yes'
ok again

$ ops invoke v1/data _op=setup
ok 

$ ops invoke v1/data _op=save id=michele data=hello
ok

$ ops invoke v1/data _op=load id=michele 
data: hello

$ ops invoke v1/data _op=save id=michele data=world
ok

$ ops invoke v1/data _op=load id=michele
data: hello, world

$ ops invoke v1/data _op=save id=mirella data=ciao
ok

$ ops invoke v1/data _op=load id=michele
as before

$ ops invoke v1/data _op=load id=mirella
data: ciao

```
URL=$(ops url v1/data | tail -1)
curl $URL/michele
curl $URL/mirella
```

same output




