var userdata;
var username;
var config;

async function setup(){
    noCanvas();
    console.log("popup has been opened");
    initPopup();
}

async function initPopup(){
    //ckeck if client has valid key and config is loaded
    var bsStatus = await initCheckBackgroundScript();
    if(bsStatus && bsStatus.status === "OK"){
        console.log("Backgrounsscript initialized");
    }else{
        console.error("Backgroundscript not initialized --> try reloading extension");
        showError({msg: "Backgroundscript not initialized. Try reloading the extension."});
        return;
    }

    //get clients username
    username = await requestUsername();
    console.log("client username = ", username);

    //get config
    config = await requestConfig();
    console.log("config loaded: ", config);

    //start listening on updateButton
    var updatebtn = select('#update');
    updatebtn.mousePressed(updatePopup);
    
    //fetch current userdata
    userdata = await fetchUserdata();
    console.log("userdata: ", userdata);
    if(userdata === undefined){
        showError({msg: "Failed to fetch userdate. Try updateing Popup. Server may be offline..."})
        return;
    }
    
    buildPopup();
}

async function initCheckBackgroundScript(){
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "get_statusBackgroundScript"}, function(res){
            resolve(res);
        })
    })
}

async function requestConfig(){
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "get_config"}, function(res){
            resolve(res.data.config);
        })
    })
}

async function requestUsername(){
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "get_username"}, function(res){
            resolve(res.data.username);
        })
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
            showError({msg: "Error while fetching userdata"});
            reject();
        })
    })
}

async function sendNewUsernameToBackground(){
    chrome.runtime.sendMessage({type: "update_username", data: {username: select('#username').value()}}, function(res){})
}

async function buildPopup(){

    //populate username input
    const usernameInput = select('#username');
    usernameInput.attribute('value', username);

    //listen on username changes
    usernameInput.input(sendNewUsernameToBackground);

    //clear content section
    clearSection('#content', 'div'); 
    clearSection('#content', 'h2'); 
    clearSection('#content', 'p'); 

    //render userdata
    renderUserdata();
}

function createListItem(element){
    var listItem = createElement('li');
    //create User Div
    var userItem = createElement('div');
    userItem.attribute('class', 'user');
    listItem.child(userItem);
    //create h3 Username
    var usernameItem = createElement('h3', element.username);
    userItem.child(usernameItem);
    //create list for userdetails
    var userdetailsListItem = createElement('ul');
    userdetailsListItem.attribute('class', 'userdetails');
    userItem.child(userdetailsListItem);
    //create watchstatus
    var watching_content;
    if(element.watching_status === "playing-mode")
        watching_content = "watching";
    else
        watching_content = element.timestamp
    var watchstatusItem = createElement('li', watching_content);
    watchstatusItem.attribute('class', 'watch_status');
    userdetailsListItem.child(watchstatusItem);
    //create link item for video
    var linkItem = createElement('a');
    linkItem.attribute('href', element.vidLink);
    linkItem.attribute('target', '_blank');
    userdetailsListItem.child(linkItem);
    //create videotitle
    var vidTitleItem = createElement('li', element.vidTitle);
    vidTitleItem.attribute('class', 'videotitle');
    linkItem.child(vidTitleItem);
    //create channelname
    var channelnameItem = createElement('li', element.vidChannelname);
    channelnameItem.attribute('class', 'channelname');
    linkItem.child(channelnameItem);

    return listItem;
}

function clearSection(parentQueryString, childQueryString){
    const parentElement = select(parentQueryString);
    var oldElements = selectAll(childQueryString, parentElement);
    oldElements.forEach(element => element.remove());
} 

function renderUserdata(){
    const contentSection = select('#content');
    
    //create users list
    var listElement = createElement('ul');
    listElement.attribute('id', 'users');
    contentSection.child(listElement);

    //create child elements and attach to listElement
    userdata.forEach(user => {
        var newChildElement = createListItem(user);
        listElement.child(newChildElement);
    })
}

function showError(data){
    clearSection('#content', '#users');
    clearSection('#content', '#loading-wrapper');
    const contentElement = select('#content');
    var errorHeadline = createElement('h2', "Error");
    contentElement.child(errorHeadline);
    var errorMessage = createElement('p', data.msg);
    contentElement.child(errorMessage);
}

function showLoading(){
    clearSection('#content', '#users');
    clearSection('#content', '#loading-wrapper');
    const contentElement = select('#content');
    var loadingWrapperElement = createElement('div');
    loadingWrapperElement.attribute('id', 'loading-wrapper');
    contentElement.child(loadingWrapperElement);
    var loadingSpinnerElement = createElement('div');
    loadingSpinnerElement.attribute('class', 'loading-spinner');
    loadingWrapperElement.child(loadingSpinnerElement);
    var loadingMessage = createElement('p', "loading");
    loadingMessage.attribute('class', 'centered');
    loadingWrapperElement.child(loadingMessage);
}

function clearList(){
    var liste = select('#users');
    var oldListeItems = selectAll('li', liste);
    oldListeItems.forEach(element => {
        element.remove();
    });
}

function updatePopup(){
    console.log("updating");
    showLoading();
    initPopup();
}