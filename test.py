import json

labelname = "test".split()
print(json)
data = json.loads('{ "test": "test" }')

for l in labelname:
    if l in data.values():
        print("yes")
    else:
        print("no")
    #     yolo[fn[:-4]]=x["values"][0]
    # if "keypoints" in y:
    #     yolo[fn[:-4]+"keypoints"]=y["keypoints"]