console.log("content script loaded");

var playingMode = undefined;
var vidId = undefined;
//initialize attribute observer --> detects changes in elements attributes
const attrObserver = new MutationObserver((mutations) => {
    mutations.forEach(mu => {
        if (mu.type !== "attributes" && mu.attributeName !== "class") return;
        updatePlayingMode();
    });
});

initContentScript();

async function initContentScript(){
    var htmlobj = document.getElementById('movie_player');
    attrObserver.observe(htmlobj, {attributes: true});
}

async function updatePlayingMode(){
    vidId = await calcVidId();
    if(vidId === "error") return

    var htmlobj = document.getElementById('movie_player');

    //temporarily save new playingmode
    if(htmlobj.classList.contains("playing-mode"))
        newPlayingMode = "playing-mode";
    if(htmlobj.classList.contains("paused-mode"))
        newPlayingMode = "paused-mode";
    if(htmlobj.classList.contains("ended-mode"))
        newPlayingMode = "paused-mode";

    //if playingmode changed update it
    if(playingMode != newPlayingMode){
        playingMode = newPlayingMode;
        console.log(playingMode);
        sendWatchUpdateMessage();
    }
}

async function sendWatchUpdateMessage(){
    chrome.runtime.sendMessage({
        type: "update_watching",
        data: {
            watching_status: playingMode,
            vidId: vidId, 
            vidLink: window.location.href
        },
        timestamp: new Date().toLocaleString()
    }, function(res){
        if(res.status === "OK")
            console.log("successfully updated watching state");
        else
            console.error("error while updating watching state", res);
    })
}

async function calcVidId(){
    return new Promise((resolve, reject) => {
        var vidId = undefined;
        
        var startIdx = window.location.href.indexOf("v=") + 2;
        vidId = window.location.href.substring(startIdx);

        var endIdx = vidId.indexOf("&");
        if(endIdx > 0)
            vidId = vidId.substring(0, endIdx);

        if(vidId != undefined)
            resolve(vidId);
        else{
            console.error("Error while parsing URL to vidID");
            reject("error");
        }
    });
}
