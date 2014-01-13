/******************************************************************************
* Author:		Neil Vosburg
* File:			beerFigure.js
*
*				This is perhaps the most naive approach to simulating JavaScript;
*				however, it isn't that hard to do and it will give us something
*				to show. This basically simulates a run/walk mode using Figure 
*				8.24 within the textbook. This has been tested, but it can still
*				contain an error.
*******************************************************************************/

var varBox = document.getElementById('varBox');			// get the variable text area
var codeBox = document.getElementById('codeBox');		// get the code text area
var textBox = document.getElementById('outputBox');		// get the output text area
var line = 0;											// the line counter -- starts at 0 (first line is line 0)
var count = null;										// the one counter variable used within the code
var initCount;											// the initial counter the user declares
var done = false;										// a flag to indicate we have finished the program
var runSlowFlag = false;								// a flag to indicate run slow has been pressed
var timeouts = [];										// an array list to store timeouts for run slow mode

// the code array is an array of strings for the code box; each line is a new index
code = [
	"var count;\n",
	"\n",
	"count = parseFloat(prompt(“How many bottles?”,0));\n",
	"while (count > 0) {\n",
	"\tdocument.write(count);\n",
	"\tdocument.writeln(“ bottles of beer on the wall,”);\n",
	"\tdocument.write(count);\n",
	"\tdocument.writeln(“ bottles of beer.”);\n",
	"\tdocument.writeln(“Take one down.  Pass it around.”);\n",
	"\tcount = count – 1;\n",
	"\tdocument.write(count);\n",
	"\tdocument.writeln(“ bottles of beer on the wall.”);\n",
	"\tdocument.writeln(“ ”);\n",
	"}"
	];
	
updateCodeBox();				// update the code box with the code in code array

function test() {
	(function() { eval.apply(this, arguments); }("var x = 10;"));
}

function test2() { console.log(x); }

// updateCodeBox() updates the code box with asterisk for the current line being executed
// this is subject to change, but for now it will do. Depending on the line count, the
// asterisks are placed accordingly
function updateCodeBox() {
	var str = "";
	for (var i = 0; i < code.length; i++) {	// iterate throughout the code array
		if (line == i) { str += "***"; }	// if its this line, place "***"
		str += "\t" + code[i];				// otherwise, just place the code line in the string
	}
	
	if (done) str += "\n***";				// if we are done, place the "***" at the end
	codeBox.value = str;					// actually set the code text area with the string
}

// this function simulates a "walk" where each line is executed once at a time
function walk() {
	if (done) {		// if the lab is done, restart and return
		restart();
		return;
	}
	
	if (line == 0) { varBox.value += "count = undefined"; }												// line 0 - declare count
	else if(line == 2) { count = prompt("How many bottles?", 0); initCount = count; updateVarBox(); }	// line 2 - prompt user
	else if(line == 3) {																				// line 3 - while loops (check condition)
		if (count <= 0) { done = true; line = 14; }														// if the while loops breaks, skip to line 14, done
	}
	else if(line == 4) { appendOutput(count); }															// line 4 - append the current count
	else if(line == 5) { appendOutput(" bottles of beer on the wall,\n"); }								// line 5 - append text literal
	else if(line == 6) { appendOutput(count); }															// line 6 - append count again
	else if(line == 7) { appendOutput(" bottles of beer.\n"); }											// line 7 - append text literal
	else if(line == 8) { appendOutput("Take one down.  Pass it around.\n"); }							// line 8 - append text literal
	else if(line == 9) { count--; }																		// line 9 - decrease count by 1
	else if(line == 10) { appendOutput(count); }														// line 10 - append count again
	else if(line == 11) { appendOutput(" bottles of beer on the wall.\n"); }							// line 11 - append text literal
	else if(line == 12) { appendOutput(" \n"); line = 2; }												// line 12 - append empty string with new line
	
	increaseLine();		// increase line count
	updateVarBox();		// update the variable text area
	updateCodeBox();	// update the code text area
}

// run() calls walk() until the done flag is set
function run() {
	if (done) { restart(); return; } // if done, restart and return
	while(!done) walk();
}

// stopRun() stops the "slow run" if it is active by clearing all timeouts
function stopRun() {
	if (runSlowFlag == true) clearTimeouts();
}

// runSlow() makes several setTimeout calls each 500 milliseconds apart from one another
// setTimeout is passed walk() so each half of a second walk() is executed
function runSlow() {
	runSlowFlag = true;					// set the run slow flag
	if (done) { restart(); return; }	// if done, restart and return

	// if (!count) means "if count isn't defined", so call walk() so it can be defined and call runSlow() in 500 milliseconds again
	if (!count) { walk(); setTimeout(runSlow, 500); return; }
	
	var i = 0;
	while (i < initCount + 1) {						// create initCount+1 setTimeout calls to ensure there are enough to finish the program
		timeouts.push(setTimeout(walk, i * 500));	// also add the setTimeout() calls to timeouts array so that they can be cancelled later if needed
		i++;
	}
}

// updateVarBox() simply adds the list of used variables and puts them in a string
function updateVarBox() {
	var str = "";
	if (count !== null) str += "count = " + count;	// if count is not null, add it to our string
	varBox.value = str;								// set value of variable box
}

// increaseLine() increases the line variable until the current line isn't a newline character
function increaseLine() {
	line++;
	while (code[line] == "\n") line++; 	// continue until a newline character isn't the current line
}

// appendOutput() simply takes the string passed to it and adds it to the end of the output box
function appendOutput(str) {
	outputBox.value += str;
}

// clearTimeouts() clears all timeout calls by iterating through timeouts array and calling clearTimeout() one each element
function clearTimeouts() { for (var i = 0; i < timeouts.length; i++) clearTimeout(timeouts[i]); }

// restart() makes it as if the lab hasn't been ran yet
function restart() {
	done = false;			// done = false
	count = null;			// set count to null
	clearTimeouts();		// clear all the timeouts that may be still active
	outputBox.value = "";	// clear the outputBox value
	updateVarBox();			// update varBox now that count is null
	timeouts = [];			// clear the timeouts array
	line = 0;				// set line to 0
	updateCodeBox();		// update the code box now that line is 0
}