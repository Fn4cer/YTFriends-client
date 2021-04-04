var config = {};
var username = "unknown";
initBackgroundScript();

async function initBackgroundScript(){
    chrome.runtime.onStartup.addListener(async function(){
        console.log("startup")
        config = await initConfig();
        updateUsername();
    })
    
    chrome.tabs.onActivated.addListener(function(infoObj){
        chrome.tabs.get(infoObj.tabId, tab => {
            updateUser(tab)
        })
    });
    
    chrome.tabs.onUpdated.addListener(function(id, changes, tab){
        if(changes.status === "complete"){
            updateUser(tab);
        }
    });
    
    chrome.runtime.onMessage.addListener(function(req, sender, sendRes){
        if(req.type == "updateUsername"){
            username = req.username;
            console.log("username updated: " + username);
        }
        else if(req.type == "getUsername"){
            sendRes({username: username});
        }
        else if(req.type == "getUsersURL"){
            sendRes({usersUrl: config.USERSURL});
        }
        else if(req.type == "testfoo"){
            console.log("testing foo");
            readfile();
            sendRes();
        }
    })
}

async function readfile(){
    chrome.fileSystem.chooseEntry({type: 'openFile'}, function(readOnlyEntry) {
    
        readOnlyEntry.file(function(file) {
            var reader = new FileReader();
    
            reader.onerror = errorHandler;
            reader.onloadend = function(e) {
            console.log(e.target.result);
            };
    
            reader.readAsText(file);
        });
    });
}

async function updateUser(tab){
    if(tab.url.includes('youtube.com/watch')){

        vidData = {
            vidId: undefined,
            username: username
        }

        //get vidId
        var startIdx = tab.url.indexOf("v=") + 2;
        vidData.vidId = tab.url.substring(startIdx);
        var endIdx = vidData.vidId.indexOf("&");

        if(endIdx > 0)
            vidData.vidId = vidData.vidId.substring(0, endIdx);


        if(config.POSTURL != undefined)
            config = await initConfig();

        fetch(config.POSTURL, {
            method: "POST", 
            headers:{
                'content-type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(vidData)
        }).then(res => {
            console.log("Request complete! response:", res);
        }).catch(error => {
              console.log("error: " + error);
        })
    }
}

function updateUsername(){
    console.log("updating Username");

    fetch(config.GETURL, {
        method: "GET",
        headers:{
            'content-type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(res => {
        res.json().then(body => {
            username = body.username;;
        });
    }).catch(error => {
        console.log("getusername: " + error);
        username = "stranger";
    })
}

async function initConfig(){
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                resolve(JSON.parse(xhr.response));
            }
        }
        xhr.open("GET", chrome.extension.getURL("/config_global.json"), true);
        xhr.send();
    })
}