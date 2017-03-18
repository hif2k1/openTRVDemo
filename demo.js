var coeficients = [1, 2, 0.7, 1];
var roomTemps = [10, 10, 10, 10];
var roomOccupied = 0;
var coolingCoeficient = 0.7;
var loop;
var minTemp = 10;
var housesToDraw = 1;
var modeNo = 0;
var screenSize = 'unknown';
var avatarAwake = false;
var container;
var houses = [];

houses[0] = new house('noTRV');
houses[1] = new house('tradTRV');
houses[2] = new house('openTRV');
houses[3] = new house('openTRVBoilerControl');

function house(mode) {
    this.roomTemps = [10, 10, 10, 10];
    this.roomCoeficients = [1, 2, 0.5, 1];
    this.radiators = [false, false, false, false];
    this.boilerOn = false;
    this.boilerCounter = 0;
    this.mode = mode;
    this.radsOn = 0;
    this.boilerFlameElement;
    this.roomElements = [];
    this.radiatorElements = [];
    this.avatarElement;
    this.avatarSpeechElement;
    this.thermostatElement;
    this.houseElement;
    this.energyBarElement;
    this.wastedBarElement;
}

function start(containerDiv) {
    container = containerDiv;
    var viewportHeight = window.innerHeight;
    var viewportWidth = window.innerWidth;
    var workingHeight = container.clientHeight;
    var workingWidth = container.clientWidth;
    
    if (workingHeight > (0.9*viewportHeight)) workingHeight = 0.9*viewportHeight;
    if (workingWidth > (0.9*viewportWidth)) workingWidth = 0.9*viewportWidth;
    if (workingWidth>(1.5*workingHeight)) workingWidth = 1.5*workingHeight;
    else if (workingHeight>(1.5*workingWidth)) workingHeight = 1.5*workingWidth;
    container.style.height = workingHeight +'px';
    container.style.width = workingWidth +'px';

    if (workingWidth >600 && workingHeight >400 && screenSize!='largeScreen') {
        housesToDraw = 4;
        screenSize = 'largeScreen';
        drawHouses();
    }
    else if ((workingWidth <=600 || workingHeight <=400) && screenSize!='smallScreen'){
        housesToDraw = 1;
        screenSize = 'smallScreen';
        drawHouses();
    }
}

function drawHouses(){
    container.innerHTML = '';
    container.className = screenSize+' roomOccupied'+roomOccupied;
    
    for (var i= 0; i<housesToDraw; i++) {
        houses[i].houseElement = addElement(container, 'house '+houses[i].mode);
        var roof = addElement(houses[i].houseElement, 'roof');
        for (var j = 0; j<4; j++) {
            var roomContainer = addElement(houses[i].houseElement, 'roomContainer');
            houses[i].roomElements[j] = addElement(roomContainer, 'room roomNumber'+j);
            houses[i].roomElements[j].setAttribute('roomnumber', j);
            houses[i].radiatorElements[j] = addElement(houses[i].roomElements[j], 'radiator');
            addElement(houses[i].radiatorElements[j], 'valve');
        }
        var boiler = addElement(houses[i].roomElements[0], 'boiler');
        houses[i].boilerFlameElement = addElement(boiler, 'flame');
        houses[i].thermostatElement = addElement(houses[i].roomElements[3], 'thermostat');
        houses[i].avatarElement = addElement(houses[i].houseElement, 'avatar');
        houses[i].avatarSpeechElement = addElement(houses[i].avatarElement, 'avatarSpeech');
        houses[i].avatarSpeechElement.textContent = 'Click a room to move me';
        if (housesToDraw == 4) {
            houses[i].energyBarElement = addElement(houses[i].houseElement, 'energyBar '+houses[i].mode);
            houses[i].wastedBarElement = addElement(houses[i].energyBarElement, 'wastedBar '+houses[i].mode);
        }
        else if (housesToDraw==1) {
            for (var j=0; j<4; j++){
                var classes;
                if (j==modeNo) classes = 'energyBar '+houses[j].mode +' selected';
                else classes = 'energyBar '+houses[j].mode;
                houses[j].energyBarElement = addElement(container, classes);
                houses[j].energyBarElement.setAttribute('modenumber', j);
                houses[j].wastedBarElement = addElement(houses[j].energyBarElement, 'wastedBar');
            }
        }
    }
    
    window.onresize = function(event) {
        start(container);
    };
    
    container.onclick = function(event) {
        var action = function(targetDiv) {
            if (targetDiv.className.indexOf('room')==0) {
                roomOccupied = parseInt(targetDiv.getAttribute('roomnumber'));
                container.className = screenSize+' roomOccupied'+roomOccupied;
                avatarAwake = true;
            }
            else if (housesToDraw == 1 && targetDiv.className.indexOf('energyBar')>=0) {
                for (var i=0; i<4; i++) {
                    houses[i].energyBarElement.className = 'energyBar '+houses[i].mode;
                }
                targetDiv.className += ' selected';
                modeNo = parseInt(targetDiv.getAttribute('modenumber'));
                houses[0].houseElement.className = 'house '+houses[modeNo].mode;
            }
            else if (targetDiv === container) {return;}
            else {action(targetDiv.parentElement);}
        }
        action(event.target);
    };
    update();
}

function addElement(parentNode, classString) {
    var newEl = document.createElement('div');
    newEl.className = classString;
    parentNode.appendChild(newEl);
    return newEl;
}

function update() {
    for(var j=0; j<houses.length; j++){
        houses[j].radsOn = 0;
        houses[j].boilerOn = false;
        if (houses[j].mode != 'openTRVBoilerControl') {
            if (houses[j].roomTemps[3]<20) {
                houses[j].boilerOn = true;
                houses[j].radsOn ++;
            }
        }
        for (var i=0; i<4; i++) {
            if ((houses[j].boilerOn && houses[j].mode == 'noTRV') || 
                (houses[j].boilerOn && houses[j].mode == 'tradTRV' && houses[j].roomTemps[i]<20) ||
                (houses[j].boilerOn && houses[j].mode =='openTRV' && houses[j].roomTemps[i]<20 && roomOccupied == i) ||
                (houses[j].mode == 'openTRVBoilerControl' && houses[j].roomTemps[i]<20 && roomOccupied == i)) {
                houses[j].roomTemps[i] = Math.min(houses[j].roomTemps[i] + coeficients[i], 30);
                houses[j].radiators[i] = true;
                houses[j].radsOn += 2;
            }
            else {
                houses[j].roomTemps[i] = Math.max(houses[j].roomTemps[i] - coolingCoeficient, minTemp);
                houses[j].radiators[i] = false;
            }
        }
        if (houses[j].mode == 'openTRVBoilerControl' && houses[j].radsOn > 0 ) {
            houses[j].boilerOn = true;
            houses[j].radsOn ++;
        }
        houses[j].boilerCounter += houses[j].radsOn;
    }
    for (var j=0; j<housesToDraw; j++){
        if (housesToDraw == 1) mode = modeNo;
        else mode = j;
        if (houses[mode].boilerOn) houses[j].boilerFlameElement.className = 'flame lit';
        else houses[j].boilerFlameElement.className = 'flame';
        for (var i=0; i<4; i++) {
            if (houses[mode].radiators[i]) houses[j].radiatorElements[i].style.backgroundColor = 'red';
            else houses[j].radiatorElements[i].style.backgroundColor = 'white';
            houses[j].roomElements[i].style.backgroundColor = calculateColour(houses[mode].roomTemps[i]);
        }
        if (avatarAwake) {
            houses[j].avatarSpeechElement.textContent = updateAvatarSpeech(houses[mode].roomTemps[roomOccupied]);
        }
    }
    var idealEnergyUse = Math.min(90, houses[3].boilerCounter/5)
    for (var j=0; j<4; j++) {
        var energyBarPercentage = Math.min(90, houses[j].boilerCounter/5);
        if (energyBarPercentage == 90) {
            for (var k=0; k<4; k++) {
                houses[k].boilerCounter = 0;
            }
            energyBarPercentage = 0;
        }
        houses[j].energyBarElement.style.width = energyBarPercentage +'%';
        houses[j].wastedBarElement.style.width = (100*(energyBarPercentage - idealEnergyUse)/energyBarPercentage) + '%';
    }
    clearTimeout(loop);
    loop = setTimeout(update, 1000);
}

function calculateColour(temp) {
    temp = (temp-10)/20;
    var colour = 'rgb(' + parseInt((400-153)*temp + 153) + ',';
    colour = colour + parseInt(204 - (204-80)*temp) +',';
    colour = colour + parseInt(255 - (255-80)*temp) +')';
    return colour;
}

function updateAvatarSpeech(temp) {
    if (temp<18) return "Too cold!";
    else if (temp>24) return "Too hot!";
    else return "Just right";
}