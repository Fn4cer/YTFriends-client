var userdata;

async function setup(){
    console.log("popup has been opened");
    noCanvas();
    
    updatePopup();
    
    var updatebtn = select('#update');
    updatebtn.mousePressed(updatePopup);

    var input_username = select('#username');
    input_username.input(updateUsername);
}

async function getUsersURL(){
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "getUsersURL"}, function(res){
            console.log(res.usersUrl);
            resolve(res.usersUrl);
        })
    });
}

async function getNewUserdata(){
    var url = await getUsersURL();
    return new Promise((resolve, reject) => {
        console.log("updating userdata...");
        console.log("hier: " + url);
        httpGet(url, 'json', function(res){
            console.log(res.data)
            resolve(res.data);
        }, function(error){
            console.log("unable to get server data");
            reject(undefined);
        })
    });
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
    var watchstatusItem = createElement('li', element.watch_status);
    watchstatusItem.attribute('class', 'watch_status');
    userdetailsListItem.child(watchstatusItem);
    //create link item for video
    var linkItem = createElement('a');
    linkItem.attribute('href', element.videoLink);
    linkItem.attribute('target', '_blank');
    userdetailsListItem.child(linkItem);
    //create videotitle
    var vidTitleItem = createElement('li', element.videoTitle);
    vidTitleItem.attribute('class', 'videotitle');
    linkItem.child(vidTitleItem);
    //create channelname
    var channelnameItem = createElement('li', element.videoChannelname);
    channelnameItem.attribute('class', 'channelname');
    linkItem.child(channelnameItem);

    return listItem;
}

async function updatePopup(){
    console.log("updating popup...");
    userdata = await getNewUserdata();
    var liste = select('#users');
    console.log(userdata);
    if(userdata != undefined){
        clearList();
        userdata.forEach(element => {
            var newListItem = createListItem(element);
            liste.child(newListItem);
        });
    }

    chrome.runtime.sendMessage({
        type: "getUsername"
    }, function(res){
        select('#username').attribute('value', res.username);
    })
}

function clearList(){
    var liste = select('#users');
    var oldListeItems = selectAll('li', liste);
    oldListeItems.forEach(element => {
        element.remove();
    });
}

function updateUsername(){
    var username = select('#username').value();
    chrome.runtime.sendMessage({
        type: "updateUsername",
        username: username
    })
}