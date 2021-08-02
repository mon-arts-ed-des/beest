const MAX_HIST = 20;
const UNSELECTED = "Select the item you wish to load..."
const OVERRIDEDATABASE = true
const DUMMY_USER = {
	staffID : 4,
	staffEmail : "fake.email@monash.edu",
	firstName : "Fake",
	lastName : "User",
	isAdmin : false
}
var historicalData = null
var histIndex = null;
var currentLocalSet = null
var theModal = null;
var theUser = null;

function getHistory(){
	return localStorage.getItem(localStorageHistory)
}
function setHistory(value){
	localStorage.setItem(localStorageHistory,value)
}

function initHistory(){
	setupUser()
	historicalData = recoverHistory();
	if (historicalData == null){
		showRecoveryDate(0,historicalData) //should trigger 'none available'
	}
	else{
		histIndex = historicalData.length-1
		showRecoveryDate(histIndex,historicalData)
	}
	try{
		hideButton("loadHist")
	}catch{}
	try{
	hideButton("delHist")
	}catch{}
}

function idSelectedRecData(){
	histIndex = JSON.parse(document.getElementById("recoveryDate").value)
	if (histIndex == null){
		hideButton("delHist")
		return
	}
	else{
		showButton("delHist")
		var tmpItem = historicalData[histIndex]
		if (tmpItem.hasOwnProperty("element")){
			historicalData[histIndex] = tmpItem.element
		} //backward compatibility -- if setup using the recoveryData class then will have a .element holding the beestElement data else won't -- this ensures data loads correctly per item
		getHistoryI(histIndex,historicalData)	
		historicalData[histIndex] = tmpItem
	}
}

function delHistI(){
	if (histIndex==null){
		console.error("unable to delete non-data from history")
	}
	else if (confirm("This will delete the selected record, click 'OK' to proceed")){
		historicalData = recoverHistory()
		historicalData.splice(histIndex,1)
		setHistory(JSON.stringify(historicalData))
		histIndex= (historicalData.length>0 ? historicalData.length-1 : 0)
	}
	showRecoveryDate(histIndex,historicalData)
}

class beestElement{
	constructor(){
		if (new.target === beestElement){
			throw new TypeError("beestElement is an abstract class and cannot be directly instantiated")
		}
		else{
			this.userEmail = theUser.staffEmail
			this.id = this.getNextID()
		}		
	}
	getNextID(){
		if (OVERRIDEDATABASE){return 4}
		throw new TypeError("getNextID - Not implemented -- requires Database lookup")
	}
}

class recoveryData{
	constructor(name,timestamp,element){
		this.name = name
		this.timestamp = timestamp
		this.element = element
	}
	toString(){
		var time = this.timestamp
		time = time.toLocaleDateString()+" "+time.toLocaleTimeString()
		return this.name+" ("+time+")"
	}
	toPDO(){
		var r = {historyTitle:this.name}
		r.timestamp = this.timestamp
		r.element = JSON.parse(JSON.stringify(this.element))
		return r
	}
	toJSON(){return this.toPDO()}
	fromObj(PDO){
		this.name = PDO.historyTitle
		this.timestamp = PDO.timestamp
		if (PDO.hasOwnProperty("element")){
			this.element = PDO.element
		}
		else{
			try{ //if wasn't a recoveryData before, make it one by putting the rest as the element
				delete PDO.timestamp
				delete PDO.historyTitle
			}
			catch{}
			this.element = PDO
		}
	}
}
class recoveryDataSet{
	constructor(recoveryDataArray){
		var element;
		var beestElem;
		var time;
		var heading;
		this.length=0
		for (var recoveryI=0;recoveryI<recoveryDataArray.length;recoveryI++){
			element = recoveryDataArray[recoveryI]
			if (element.hasOwnProperty("element")){//backwards compatibility -- past data entered with flat structure
				beestElem = element.element
			}
			else{
				beestElem = element;
			}
			if (element.hasOwnProperty("historyTitle")){
				heading = element.historyTitle
			}
			else{
				heading = beestElem.mainHead
			}
			time = new Date(element.timestamp)
			this[recoveryI] = new recoveryData(heading,time,beestElem)
			this.length++
		}
	}
	toString(){
		return JSON.stringify(this.dataSet)
	}
}

function HTMLOption(value,inner,selected){
	return "<option "+(selected ? "selected " : "")+"value=\""+value+"\">"+inner+"</option>"
}

function recoveryOptionGenerator(selectedIndex,aRecoveryDataSet){
	var outputHTML = ""
	var element;
	var HTMLElement;
	var startAt = aRecoveryDataSet.length-1
	var stopAt = Math.max(0,aRecoveryDataSet.length-MAX_HIST)
	if (aRecoveryDataSet.length>0){
		outputHTML += HTMLOption(null,UNSELECTED,true)
	}
	for (var dataI = startAt; dataI>=stopAt; dataI--){
		element = aRecoveryDataSet[dataI].toString()
		HTMLElement = HTMLOption(dataI,element,false)//dataI==selectedIndex)
		outputHTML+=HTMLElement
	}
	return outputHTML
}

function setupUser(){
	if (OVERRIDEDATABASE){
		theUser = new User()
		theUser.fromObj(DUMMY_USER)
	}
	else{
		throw new TypeError("user creation not defined")
	}
}

function showRecoveryDate(index,history){
	try{
		if ((history==null)||(!history.hasOwnProperty("length"))||(history.length==0)){
			throw Error("localStorage is empty")
		}
		var recHistSet = new recoveryDataSet(history)
		var element = recHistSet[index]
		document.getElementById("recoveryDate").innerHTML = recoveryOptionGenerator(index,recHistSet)
	}
	catch (error){
		console.log(error)
		document.getElementById("recoveryDate").innerHTML = HTMLOption(null,"no history available",true)
		hideButton("delHist")
		hideButton("loadHist")
	}
}
	
	
function recoverHistory(){
	/*get from local then populate the text fields*/
	var localSet = getHistory()
	if (localSet == undefined){
		return null
	}
	localSet = JSON.parse(localSet) //converted the string to an array of public objects
	return localSet
}

	function hideButton(id){
		document.getElementById(id).disabled = true
		hideHTML(id)
	}
	function showButton(id){
		document.getElementById(id).disabled = false
		showHTML(id)
  }
  
  
	function showHTML(id){
		htmlStyle(id,"display","")
	}
	function hideHTML(id){
		htmlStyle(id,"display","none")
	}
		
	function htmlStyle(id,styleName,styleResult){
		document.getElementById(id).style[styleName]=styleResult
	}

function savePopup(currentItem){
	if (theUser===null){
		setupUser()
	}
	
	var send_placeholder = currentItem.mainHead
	if ((send_placeholder == undefined)||(send_placeholder=="")){
		send_placeholder = "[placeholder]"
	}
	var time = currentItem.timestamp
	time = time.toLocaleDateString() + " " + time.toLocaleTimeString()
	var data = {
		id: "savePopup",
		title:"Save in browser?",
		description: "<b>Code copied!</b><br><br>Save this element in your ("+theUser.staffEmail+") account?<br><br>Name:",
		textField: 1,
		placeholder: send_placeholder,
		previewResult: "$1 ($2)",
		args:[currentItem.mainHead,time],
		buttons: [
			{
				text:"cancel",
				colour:"danger",
				result:"close"
			},
			{
				text:"save",
				colour:"success",
				result:"addToHistory_Aux(theModal.args[0])"
			}
		]
	}
	if (theModal==null){
		theModal = new modal(data)
	}
	else{
		theModal.setData(data)
		theModal.build()
	}
	theModal.display()
}

function addToHistory_Aux(name){
	//currentLocalSet will have the most recent element added to the end and ready to updateCommands
	var loaded = currentLocalSet.pop()
	loaded.historyTitle = name
	currentInstance = new recoveryData()
	currentInstance.fromObj(loaded)
	currentLocalSet.push(currentInstance)
	
	currentLocalSet = JSON.stringify(currentLocalSet) //now a string again -- currentInstance should have had its toString method called
	setHistory(currentLocalSet)
	historicalData = recoverHistory()
	histIndex = historicalData.length-1
	showRecoveryDate(histIndex,historicalData);
	showButton("delHist")
	//showButton("loadHist")
}
function addToHistory(currentInstance){
	currentLocalSet = getHistory()
	if ((currentLocalSet == undefined)||(currentLocalSet=="")){
		currentLocalSet = "[]"
		setHistory(currentLocalSet)
	}
	currentLocalSet = JSON.parse(currentLocalSet) //now an array of objects
	currentInstance = JSON.parse(JSON.stringify(currentInstance))
	currentInstance.timestamp = new Date()
	currentLocalSet.push(currentInstance)
	savePopup(currentInstance)
}