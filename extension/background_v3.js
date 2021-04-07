var config;
var clientKey;
var username;
var userdata;
const CONFIG_PATH = "/config_local.json";

initBackgroundScript();


async function initBackgroundScript(){
    console.log("backgroundScript loaded")

    //initialize config
    config = await initConfig();
    console.log("config file loaded: ", config);

    //initialize identification --> client_key
    clientKey = await initClientKey();
    chrome.storage.local.get('clientKey', function(res){
        console.log("clientKey initialized: ", res);
    });

    //initialize username
    username = await initUsername();
    console.log("username initialized: ", username);

    //handle messaging
    chrome.runtime.onMessage.addListener(async (req, sender, sendRes) => {
        switch(req.type){
            case "update_watching":
                console.log("received update_watching request", req)
                sendWatchingUpdate(req);
                sendRes({data: undefined, msg: "received update_watching request", status: "OK"});
                break;
            case "get_statusBackgroundScript":
                console.log("received get_statusBackgroundScript request", req)
                if(username != undefined && config != undefined)
                    sendRes({data: undefined, msg: "received get_statusBackgroundScript request", status: "OK"});
                else
                    sendRes({data: undefined, msg: "received get_statusBackgroundScript request", status: "ERROR"});
                break;
            case "get_username":
                console.log("received get_username reqeuest", req)
                sendRes({data: {username: username}, msg: "received get_username request", status: "OK"});
                break;
            case "update_username":
                console.log("received update_username reqeuest", req)
                username = req.data.username;
                sendRes({data: undefined, msg: "received update_username reqeuest", status: "OK"});
                break;
            case "get_config":
                console.log("received get_config reqeuest", req)
                sendRes({data: {config: config}, msg: "received get_config reqeuest", status: "OK"});
                break;
            default:
                console.error("received unknown reqeuest", req)
                sendRes({data: undefined, msg: "unknown request type", status: "ERROR"});
        }

        return true;
    });
}

async function initConfig(){
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                resolve(JSON.parse(xhr.response));
            }
        }
        xhr.open("GET", chrome.extension.getURL(CONFIG_PATH), true);
        xhr.send();
    })
}

async function initClientKey(){
    return new Promise(async (resolve, reject) => {

        //get currently saved clientKey
        var currClientKey = await new Promise((resolve, reject) => {
            chrome.storage.local.get('clientKey', function(res){
                resolve(res);
            })
        });
        
        //check if clientKey is valid, else get valid key
        var finalClientKey;

        await new Promise((resolve, reject) => {

            fetch(config.post.CLIENTKEY, {
                method: "POST",
                headers:{
                    'content-type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(currClientKey)
            })
            .then(res => {
                res.json().then(body => {
                    resolve(body.clientKey);
                });
            })
            .catch(error => {
                reject(error);
            })

        })
        .then(function(clientKey){
            //overwrite clientKey and save it to hard disk 
            finalClientKey = clientKey;
            chrome.storage.local.set({clientKey: clientKey})
            resolve(finalClientKey);
        })
        .catch(function(error){
            console.error("error while checking clientKey: ", error);
            reject();
        })
    })
}

async function initUsername(){
    return new Promise((resolve, reject) => {
        fetch(config.post.USERNAME, {
            method: "POST",
            headers:{
                'content-type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({clientKey: clientKey, type: "get"})
        }).then(res => {
            res.json().then(body => {
                resolve(body.username);
            });
        }).catch(error => {
            console.error("Error while fetching username: ", error);
            reject(error);
        })
    })
}

async function sendWatchingUpdate(req){
    fetch(config.post.WATCHING, {
        method: "POST", 
        headers:{
            'content-type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            vidId: req.data.vidId,
            vidLink: req.data.vidLink,
            watching_status: req.data.watching_status,
            timestamp: req.timestamp,
            username: username, 
            clientKey: clientKey
        })
    }).then(res => {
        console.log("successfully postet watching update", res);
    }).catch(error => {
        console.error("error while fetching watching update ", error);
    })
}

async function fetchUserdata(){
    return new Promise((resolve, reject) => {
        fetch(config.get.USERDATA, {
            method: "GET",
            headers:{
                'content-type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(res => {
            res.json().then(body => {
                console.log("body.data: ", body.data)
                resolve(body.data);
            });
        }).catch(error => {
            console.error("Error while fetching userdata: ", error);
            reject();
        })
    })
}