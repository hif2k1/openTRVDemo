var coeficients = [2, 2, 0.7, 1];
var roomTemps = [10, 10, 10, 10];
var roomOccupied = 0;
var coolingCoeficient = 0.7;
var roomChangeDelay = 0;
var loop;
var automationTimer;
var minTemp = 14;
var avatarAwake = false;
var container;
var modes = ['noTRV', 'tradTRV', 'openTRV', 'openTRVBoilerControl'];
var houses = [];
var guideTextArea;
var guideTextTitle;
var roomTextArea;
var focusHouse = 0;
var maxHeight = 0;
var maxWidth = 0;
var automationDelay = 30000;
var automationFrequency = 20000;
var detectedOrientation = 'portrait';
var costScale = 2;
var comfortScale = 1.5;

function start(containerDiv) {
    focusHouse = 0;
    container = containerDiv;
    
    for (var i=0; i<modes.length; i++){
        houses[i] = new house()
    }

    maxHeight = container.clientHeight;
    maxWidth = container.clientWidth;

    resize();
    drawHouses();
    
    function house() {
        this.roomTemps = [10, 10, 10, 10];
        this.roomCoeficients = [1, 2, 0.5, 1];
        this.radiators = [false, false, false, false];
        this.boilerOn = false;
        this.energyUsed = 0;
        this.energyWasted = 0;
        this.overheating = 0;
        this.extraEnergyRequested = 0;
        this.avatarHotCounter = 0;
        this.avatarColdCounter = 0;
        this.avatarOkCounter = 0;
        this.boilerFlameElement;
        this.roomElements = [];
        this.radiatorElements = [];
        this.avatarElement;
        this.avatarSpeechElement;
        this.thermostatElement;
        this.houseElement;
        this.energyBarElement;
        this.wastedBarElement;
        this.usedBarElement;
        this.overheatingBarElement;
        this.avatarComfortBarElement;
        this.coldBarElement;
        this.comfortableBarElement;
        this.hotBarElement;
    }
}

function drawHouses(){
    container.innerHTML = '';
    var guideTextContainer = addElement(container, 'guideText');
    guideTextTitle = addElement(guideTextContainer, 'guideTextTitle');
    guideTextTitle.textContent = textStringsEnglish[modes[focusHouse]]['title'];
    guideTextArea = addElement(guideTextContainer, 'guideTextContent');
//    guideTextArea.textContent = textStringsEnglish[modes[focusHouse]]['guideText'];
    facLink = document.createElement('a');
    facLink.setAttribute('href', 'https://github.com/opentrv/OTWiki/wiki/FAQ');
    facLink.textContent = 'Click here to go to our wiki for more on how Radbot works';
    guideTextArea.appendChild(facLink);
    roomTextArea = addElement(guideTextContainer, 'guideTextContent');
    roomTextArea.textContent = textStringsEnglish.defaultRoomText;
    var resetButton = addElement(guideTextContainer, 'button reset');
    resetButton.textContent = "Reset";
    var nextButton = addElement(guideTextContainer, 'button next');
    nextButton.textContent = "Upgrade Valves";
    var housesContainer = addElement(container, 'housesContainer')

    for (var i= 0; i<4; i++) {
        var houseClassName;
        if (modes[i] == modes[focusHouse]) houseClassName = 'house '+modes[i]+' selected';
        else houseClassName ='house '+modes[i]+' notSelected';
        houses[i].houseElement = addElement(housesContainer, houseClassName);
        houses[i].houseElement.setAttribute('houseMode', modes[i]);
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
        if (focusHouse == i) houses[i].avatarElement.setAttribute('draggable', 'true');
        houses[i].avatarSpeechElement = addElement(houses[i].avatarElement, 'avatarSpeech');
        houses[i].avatarSpeechElement.textContent = textStringsEnglish.avatar.start;
        houses[i].energyBarElement = addElement(houses[i].houseElement, 'energyBar '+modes[i]);
        houses[i].usedBarElement = addElement(houses[i].energyBarElement, 'barGraph usedBar');
        houses[i].wastedBarElement = addElement(houses[i].energyBarElement, 'barGraph wastedBar');
        houses[i].overheatingBarElement = addElement(houses[i].energyBarElement, 'barGraph overheatingBar');
        houses[i].avatarComfortBarElement = addElement(houses[i].houseElement, 'energyBar comfortBar');
        houses[i].coldBarElement = addElement(houses[i].avatarComfortBarElement, 'barGraph coldBar');
        houses[i].comfortableBarElement = addElement(houses[i].avatarComfortBarElement, 'barGraph comfortableBar');
        houses[i].hotBarElement = addElement(houses[i].avatarComfortBarElement, 'barGraph hotBar');
    }

    container.onclick = function(event) {
        clearTimeout(automationTimer);
        automationTimer = setTimeout(automateChanges,automationDelay);

        var action = function(targetDiv) {
            if (targetDiv.className.indexOf('room')==0) {
                var houseMode = targetDiv.parentElement.parentElement.getAttribute('houseMode');
                if (houseMode===modes[focusHouse]) {
                    changeOccupiedRoom(parseInt(targetDiv.getAttribute('roomnumber')));
                }
                else {
                    action(targetDiv.parentElement);
                }
            }
            else if (targetDiv.className.indexOf('house')==0) {
                var modeToTest = targetDiv.getAttribute('houseMode');
                if (modeToTest!==modes[focusHouse]) {
                    changeFocusHouse(modes.indexOf(modeToTest));
                }
            }
            else if (targetDiv.className.indexOf('button next')==0) {
                changeFocusHouse(Math.min(3,focusHouse+1));
            }
            else if (targetDiv.className.indexOf('button reset')==0) {
                start(container);
            }
            else if (targetDiv === container) {return;}
            else {action(targetDiv.parentElement);}
        }
        action(event.target);
    };

    container.ondragover = function(ev) {
        ev.preventDefault();
    }
    
    container.ondrop = function(ev) {
        
        var dropAction = function(targetDiv){
            if (targetDiv===container) return;
            var newRoom = targetDiv.getAttribute('roomNumber');
            ev.preventDefault();
            if (newRoom !== null &&
                newRoom !== undefined &&
                targetDiv.parentElement.parentElement.className.indexOf('selected')>0)
                {
                    changeOccupiedRoom(newRoom);        
                    ev.preventDefault();
                }
            else dropAction(targetDiv.parentElement);
        }
        dropAction(ev.target);
    }
    
    update();
    clearTimeout(automationTimer);
    automationTimer = setTimeout(automateChanges,automationDelay);
}

function changeFocusHouse(newFocus){
    if (newFocus===null || newFocus===undefined || newFocus<0 || newFocus >3) return;
    focusHouse = newFocus;
    guideTextTitle.textContent = textStringsEnglish[modes[focusHouse]]['title'];
//    guideTextArea.textContent = textStringsEnglish[modes[focusHouse]]['guideText'];
    container.className = 'demoContainer roomOccupied'+roomOccupied + ' '+modes[focusHouse]+' '+detectedOrientation;
    for (var i=0; i<4; i++) {
        var houseClassName;
        if (focusHouse == i) {
            houseClassName = 'house '+modes[i]+' selected';
            houses[i].avatarElement.setAttribute('draggable', 'true');
        }
        else {
            houseClassName = 'house '+modes[i]+' notSelected';
            houses[i].avatarElement.setAttribute('draggable', 'false');
        }
        houses[i].houseElement.className = houseClassName;
    }
}

function changeOccupiedRoom(roomNumber) {
    roomChangeDelay = 8;
    roomOccupied = roomNumber;
    container.className = 'demoContainer roomOccupied'+roomOccupied+' '+modes[focusHouse]+' '+detectedOrientation;
    for (var i=0; i<4; i++) {houses[i].avatarSpeechElement.textContent = 'hmm...';}
    avatarAwake = true;
    roomTextArea.textContent = textStringsEnglish[modes[focusHouse]]['roomLabels'][roomOccupied];
}

function addElement(parentNode, classString) {
    var newEl = document.createElement('div');
    newEl.className = classString;
    parentNode.appendChild(newEl);
    return newEl;
}

function update() {
    for(var j=0; j<houses.length; j++){
        var roomsWithValves = 4;
        houses[j].boilerOn = false;
        if (modes[j] != 'openTRVBoilerControl') {
            roomsWithValves = 3;
            if (houses[j].roomTemps[3]<20) {
                houses[j].boilerOn = true;
                houses[j].radiators[3] = true;
                houses[j].roomTemps[3] = Math.min(houses[j].roomTemps[3] + coeficients[3], 30);
                if (roomOccupied==3) houses[j].energyUsed++;
                else houses[j].energyWasted++;
            }
            else {
                houses[j].roomTemps[3] = Math.max(houses[j].roomTemps[3] - coolingCoeficient, minTemp);
                houses[j].radiators[3] = false;
            }
        }
        for (var i=0; i<roomsWithValves; i++) {
            if ((houses[j].boilerOn && modes[j]== 'noTRV') || 
                (houses[j].boilerOn && modes[j] == 'tradTRV' && houses[j].roomTemps[i]<20) ||
                (houses[j].boilerOn && modes[j] =='openTRV' && houses[j].roomTemps[i]<20 && roomOccupied == i) ||
                (modes[j] == 'openTRVBoilerControl' && houses[j].roomTemps[i]<20 && roomOccupied == i)) {
                    houses[j].radiators[i] = true;
                    houses[j].boilerOn = true; //for the openTRV boiler control house
                    //Allocate energy use
                    if (modes[j] == 'openTRVBoilerControl' && !houses[2].boilerOn) {
                        houses[j].extraEnergyRequested++;
                    }
                    else if (roomOccupied==i && houses[j].roomTemps[i]<20) {
                        houses[j].energyUsed++;
                    }
                    else if (houses[j].roomTemps[i]>=20) {
                        houses[j].overheating++;
                    }
                    else {
                        houses[j].energyWasted++;
                    }
                    houses[j].roomTemps[i] = Math.min(houses[j].roomTemps[i] + coeficients[i], 30);
            }
            else {
                houses[j].roomTemps[i] = Math.max(houses[j].roomTemps[i] - coolingCoeficient, minTemp);
                houses[j].radiators[i] = false;
            }
        }
    }
    for (var j=0; j<4; j++){
        if (houses[j].boilerOn) houses[j].boilerFlameElement.className = 'flame lit';
        else houses[j].boilerFlameElement.className = 'flame';
        for (var i=0; i<4; i++) {
            if (houses[j].radiators[i]) houses[j].radiatorElements[i].style.backgroundColor = 'red';
            else houses[j].radiatorElements[i].style.backgroundColor = 'white';
            houses[j].roomElements[i].style.backgroundColor = calculateColour(houses[j].roomTemps[i]);
        }
        if (roomChangeDelay<1) {
            var avatarText;
            if (houses[j].roomTemps[roomOccupied]<18) {
                avatarText = textStringsEnglish.avatar.tooCold;
                houses[j].avatarColdCounter++;
            }
            else if (houses[j].roomTemps[roomOccupied]>24) {
                avatarText = textStringsEnglish.avatar.tooHot;
                houses[j].avatarHotCounter++;
            }
            else {
                avatarText = textStringsEnglish.avatar.justRight;
                houses[j].avatarOkCounter++;
            }
            if (avatarAwake) houses[j].avatarSpeechElement.textContent = avatarText;
            }
        else {roomChangeDelay--;}
    }
    var minimum = houses[3].energyUsed/5;
    for (var j=0; j<4; j++) {
        var totalEnergyUsed = (houses[j].energyUsed+houses[j].overheating+houses[j].energyWasted)/costScale;
        var extraEnergyRequested = houses[j].extraEnergyRequested/costScale;
        if (totalEnergyUsed > 90) {
            for (var k=0; k<4; k++) {
                houses[k].energyUsed = 0;
                houses[k].energyWasted = 0;
                houses[k].overheating = 0;
                houses[k].extraEnergyRequested = 0;
                houses[k].avatarColdCounter = 0;
                houses[k].avatarHotCounter = 0;
                houses[k].avatarOkCounter = 0;
            }
            totalEnergyUsed = 0;
            extraEnergyRequested = 0;
            minimum = 0;
        }
        if (modes[j]=='openTRVBoilerControl') {
            houses[j].usedBarElement.style.width = (minimum + extraEnergyRequested) +'%';                    
        }
        else {
            houses[j].usedBarElement.style.width = minimum +'%';
        }
        houses[j].wastedBarElement.style.width = totalEnergyUsed - minimum + '%';

        houses[j].coldBarElement.style.width = houses[j].avatarColdCounter/comfortScale +'%';
        houses[j].comfortableBarElement.style.width = houses[j].avatarOkCounter/comfortScale +'%';
        houses[j].hotBarElement.style.width = houses[j].avatarHotCounter/comfortScale +'%';
    }
    clearTimeout(loop);
    loop = setTimeout(update, 1000);
}

function calculateColour(temp) {
    temp = (temp-12)/15;
    var colour = 'rgb(' + parseInt((400-153)*temp + 153) + ',';
    colour = colour + parseInt(204 - (204-80)*temp) +',';
    colour = colour + parseInt(255 - (255-80)*temp) +')';
    return colour;
}

window.onresize = function(event) {
    resize()
}

function resize(){
    var viewportHeight = window.innerHeight;
    var viewportWidth = window.innerWidth;
    var workingHeight = maxHeight;
    var workingWidth = maxWidth;
    
    // Limit the demo to fit on the screen
    if (workingHeight > (0.9*viewportHeight)) workingHeight = 0.9*viewportHeight;
    if (workingWidth > (0.9*viewportWidth)) workingWidth = 0.9*viewportWidth;
    // Detect Orientation
    if (workingWidth > workingHeight) detectedOrientation = 'landscape'
    else detectedOrientation = 'portrait';
    // Limit the maximum aspect ratio
    workingWidth = Math.min(workingWidth, workingHeight*2);
    workingHeight = Math.min(workingHeight, workingWidth*2);
    
    container.style.height = workingHeight +'px';
    container.style.width = workingWidth +'px';
    
    container.className = 'demoContainer roomOccupied'+roomOccupied +' '+modes[focusHouse]+' '+detectedOrientation;
}

function automateChanges() {
    var newOccupiedRoom = (roomOccupied+1)%4;
    changeOccupiedRoom(newOccupiedRoom);
    if (newOccupiedRoom == 0) {
        var newFocusHouse = (focusHouse+1)%4;
        changeFocusHouse(newFocusHouse);
    }
    clearTimeout(automationTimer);
    automationTimer = setTimeout(automateChanges,automationFrequency);
}


var textStringsEnglish = {
    defaultRoomText: 'Drag the person to a different room and compare their bills and how comfortable they are.',
    energyUsedLabel: 'Cost of heating occupied rooms', 
    noTRV: {
        guideText: 'Information about house with no valves',
        title:'No radiator valves',
        roomLabels: {
            0: 'This room heats quicker than the room with the thermostat so it overheats',
            1: 'This room heats quicker than the room with the thermostat so it overheats',
            2: 'This room heats slower than the room with the thermostat so it never gets warm enough',
            3: 'This room has the thermostat so the temperature in here is kept just right'
            },
        energyBarLabel: "No valves",
        wastedBarLabel: "Energy wasted (overheating rooms and heating empty rooms)",
        overheatingBarLabel: 'Energy wasted overheating rooms'
    },
    tradTRV: {
        guideText: 'Information about traditional TRVs',
        title:'Thermostatic valves (TRVs)',
        roomLabels: {
            0: 'This room heats quicker than the room with the thermostat, but the valve stops it overheating',
            1: 'This room heats quicker than the room with the thermostat, but the valve stops it overheating',
            2: 'This room is cold even with a TRV because the boiler turns off when the room with the thermostat warms up',
            3: 'This room has the thermostat so a TRV can\'t be fitted here or the boiler will not be regulated'
            },
        energyBarLabel: "Thermostatic",
        wastedBarLabel: "Energy wasted (heating empty rooms)",
    },
    openTRV: {
        guideText: 'Information about Radbot valves',
        title:'Radbot',
        roomLabels: {
            0: 'Now most rooms are only heated when someone is in them',
            1: 'This room is still kept from overheating',
            2: 'This room is still too cold because the Radbot can\'t communicate with the boiler',
            3: 'This room has the thermostat so a Radbot valve can\'t be fitted here or the boiler will not be regulated'
            },
        energyBarLabel: "Radbot",
        wastedBarLabel: "Energy wasted (heating one empty room)",
    },
    openTRVBoilerControl: {
        guideText: 'Information about Radbot valves and boiler control',
        title:'Radbot + boiler control',
        roomLabels: {
            0: 'Now all rooms are only heated when someone is in them',
            1: 'Now all rooms are only heated when someone is in them',
            2: 'This room is kept just right when occupied as the Radbot can request a little extra heat to get it up to temperature',
            3: 'No thermostat is needed so now this room is just like the others'
            },
        energyBarLabel: "Radbot + boiler control",
        wastedBarLabel: "Extra heat requested by Radbots for rooms that wouldn't get up to temperature otherwise",
    },
    avatar: {
        start: "Move me to a different room",
        tooCold: "Too cold!",
        tooHot:  "Too hot!",
        justRight: "Just right"
    }
}