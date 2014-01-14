/***********************************************************************************
* Author:	Neil Vosburg
* File:		editor.js
*
*			This is the beginnings of an editor for the JavaScript lab. Its purpose
*			is to mimic Watson as it is now.
************************************************************************************/

var codeTable = document.getElementById('editor');		// the main table
var selRow = 0;											// the current selected row
var blank = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";			// blank template for unselected row
var arrow = "&nbsp;&#8594;&nbsp;&nbsp;&nbsp;";			// arrow template for selected row
var indent = "&nbsp;&nbsp;&nbsp;"						// indention used for inside brackets
var variableCount = 0;									// keeps count of the amount of variables
var funcCount = 0;										// keeps count of number of functions
var programStart = 0;									// the line the main program starts
var firstMove = false;									// keeps track if the user has added something to the main program
var innerTableTemplate = "<table class='innerTable'><tr><td>&nbsp;&nbsp;</td><td>" + blank + "</td></tr></table>";	// template used for a newly added row in the codeTable
var innerTableArrowTemplate = "<table class='innerTable'><tr><td>&nbsp;&nbsp;</td><td>" + arrow + "</td></tr></table>"; // template used for a newly selected row
var green = "#007500";
var blue = "#0000FF";
var black = "#000000";
var functionList = [];									// an array of currently declared functions

init();					// initialize some important stuff

// init() .... it initializes some important stuff .. o_0
function init() {
	var row;
	var cell;
	var innerTable;
	
	// iterate twice
	for (var i = 0; i < 2; i++) {
		row = codeTable.insertRow(i);			// add a new row at the first first postion in the main table
		cell = row.insertCell(0);				// insert a cell in this newly created row
		cell.innerHTML = innerTableTemplate;	// set the cell tot he inner table template (this creates the table within a table)
		innerTable = codeTable.rows[i].cells[0].children[0];	// grab the object of the inner table so we can use JavaScript calls on it
		
		// depending on the iteraton, we do different things
		if (i == 0) { addRow(innerTable, [ "//&nbsp;", "Scratch Pad" ], 2); addRowStyle(innerTable, [ green, green ], 2); }	// first iteration: add "// Scratch Pad" to the first row, style it
		else if (i == 1) addRow(innerTable, [ "&nbsp;" ], 2);	// on the second iteration, add a blank line (separate row)
	}
	
	// make a blank row where the program starts (this could have been in the for loops above)
	row = codeTable.insertRow(2);	// make a new row
	cell = row.insertCell(0);		// make a new cell here
	cell.innerHTML = innerTableArrowTemplate;	// set the cell with arrow template
	programStart = 2;				// increate the program start to 2
	selRow = 2;						// selected row is line 2
	refreshLineCount();				// refresh the line count along the left margin
}

// all this does is initialize the jQuery UI dialog 
$("#selectDialog").dialog({
            modal: false,
            autoOpen: false,
            height: 200,
            width: 175,
			position:[300,20],
			open: function (event, ui) {
				$('#selectDialog').css('overflow', 'hidden'); //this line does the actual hiding
			}
    });
	
toggleEvents(); // initialize events

// we must refresh the events upon each change within the tables... toggleEvents() is called each time something is altered
function toggleEvents() {
	$('.innerTable').off('mouseover');						// turn off mouseover event
	
	$('.innerTable').on('mouseover', 'td', function(){		// turn it back on
		cellVal = $(this).text();							// grab the hovered cell's value
		colNum = ($(this).index());							// grab the hovered cell's index
		var rowNum = ($(this).parent().parent().parent().parent().parent().index());	// grab the row number from codeTable (this is a silly way of doing it, but it works)
		
		// depending on what cell the mouse if over, highlight accordingly
		// go look at the functions getting called here to understand what is going on
		// we pass rowNum and colNum to tell the function where start highlighting
		if (cellVal.indexOf("while") >= 0) highlightControlStructure(rowNum, colNum);
		else if (cellVal.indexOf("if") >= 0) highlightControlStructure(rowNum, colNum);
		else if (cellVal.indexOf("function") >= 0) highlightControlStructure(rowNum, colNum);
		else if (cellVal.indexOf("for") >= 0) highlightControlStructure(rowNum, colNum);
		else if (cellVal.indexOf('{') >= 0) highlightControlStructure(rowNum - 1, 0); 	// start highlighting a line before the '{'
		else if (cellVal.indexOf('(') >= 0) highlightParenthesis('(', ')', rowNum, colNum);	// must highlight backwards if we land on a '}'
		else if (cellVal.indexOf('}') >= 0) highlightControlStructureBackwards(rowNum, colNum);
		else if (cellVal.indexOf(')') >= 0)	highlightParenthesisBackwards('(', ')', rowNum, colNum);
		else if(cellVal.indexOf('var') >= 0 || cellVal.indexOf(';') >= 0 || cellVal.indexOf('//') >= 0) highlightLine(rowNum, colNum);
		else highlightCell(rowNum, colNum);
	});
	
	$('.innerTable').off('mouseout');					// toggle mouseout event
	
	// we must put the cells we highlight red back to their normal state after we mouseout of them
	$('.innerTable').on('mouseout', 'td', function(){
		for (var i = 0; i < codeTable.rows.length; i++) {
			var innerTable = codeTable.rows[i].cells[0].children[0];										// grab the inner table for this table data object
			var numCells = innerTable.rows[0].cells.length													// grab the number of cells in this inner table
			
			// we must look for special characters/keywords that let us now we need to re-color cells in that row
			if (numCells >= 3 && innerTable.rows[0].cells[2].innerHTML.indexOf("//") >= 0) {				// a comment? it needs to be green
				for (var j = 0; j < 2; j++) innerTable.rows[0].cells[j].style.color = black;				// first two cells are number and blank space (or possibly an arrow)
				for (var j = 2; j < numCells; j++) innerTable.rows[0].cells[j].style.color = green;			// last cells are the comment, make it green
			}
			else if (numCells >= 3 && innerTable.rows[0].cells[2].innerHTML.indexOf("function") >= 0) {		// a function declaration? function needs to be blue
				for (var j = 0; j < numCells; j++) {														
					if (j == 2) innerTable.rows[0].cells[j].style.color = blue;								// color "function" blue
					else if (j == 5 || j == 6) innerTable.rows[0].cells[j].style.color = green;				// the comment at the end of function needs to be green
					else innerTable.rows[0].cells[j].style.color = black;									// the rest black
				}
			}
			else if (numCells == 7 && innerTable.rows[0].cells[2].innerHTML.indexOf("var") >= 0) {			// a variable declaration? (num cells = 7) var needs to be blue
				for (var j = 0; j < numCells; j++) {
					if (j == 2) innerTable.rows[0].cells[j].style.color = blue;								// make var blue
					else if (j == 5 || j == 6) innerTable.rows[0].cells[j].style.color = green;				// the comment needs to be green
					else innerTable.rows[0].cells[j].style.color = black;									// the rest black
				}
			}
			else if (numCells > 7 && innerTable.rows[0].cells[2].innerHTML.indexOf("var") >= 0) {			// an array declaration? (num cells > 7) var needs to be blue, new needs to be blue
				for (var j = 0; j < numCells; j++) {
					if (j == 2 || j == 5) innerTable.rows[0].cells[j].style.color = blue;					// make var and new blue
					else if (j == 11 || j == 12) innerTable.rows[0].cells[j].style.color = green;			// make comment green
					else innerTable.rows[0].cells[j].style.color = black;									// the rest black
				}
			}
			else if (numCells >= 3 && cellContainsKeyword(innerTable, 2)) {									// any keywords? (if, while, else, for, etc) ?
				for (var j = 0; j < numCells; j++) {
					if (j == 2) innerTable.rows[0].cells[j].style.color = blue;								// make the keyword blue
					else innerTable.rows[0].cells[j].style.color = black;									// the rest black
				}
			}
			else {
				for (var j = 0; j < numCells; j++) {														// the rest is black
					innerTable.rows[0].cells[j].style.color = "#000000";
				}
			}
		}
		
		codeTable.style.cursor = 'default';
	});
	
	$('.innerTable').off('click');						// toggle click event
		
	$(".innerTable").on('click','td',function(e) {		// the click event on a table data object
		var cellVal = $(this).text();					// grab the cell value of clicked cell
		var cellNum = $(this).index();					// grab the cell number of clicked cell
		var rowNum = ($(this).parent().parent().parent().parent().parent().index());	// grab row number in codeTable of clicked cell
		
		// if we click the number of the line (very left cell in each row), we try to delete something
		if (colNum == 0) {
			deleteFunction(rowNum, colNum);
			return;
		}
		
		if (selRow == rowNum) return;			// the selected row was clicked? do nothing
		if (rowNum < variableCount) return;		// we don't allow users to move into variables section
		
		// if the cell value is a blank (5 non-breaking spaces '\xA0'), we try to move to that location
		if (cellVal == '\xA0\xA0\xA0\xA0\xA0') {
			var innerTable = codeTable.rows[rowNum].cells[0].children[0];		// grab the inner table of this row
			if (checkValidRow(innerTable.rows[0], rowNum) == false) return;		// check to see if this is a valid position
			moveToLine(rowNum);												// move to line if we make it here
		}
		else $("#selectDialog").dialog('open');									// if its not a blank space, we clicked a cell, open selection dialog
	}); 
}

// check to see if a specific cell contains a keywords; return true if so
function cellContainsKeyword(table, cellNo) {
	if (table.rows[0].cells[cellNo].innerHTML.indexOf("while") >= 0) return true;
	if (table.rows[0].cells[cellNo].innerHTML.indexOf("if") >= 0) return true;
	if (table.rows[0].cells[cellNo].innerHTML.indexOf("else") >= 0) return true;
	if (table.rows[0].cells[cellNo].innerHTML.indexOf("for") >= 0) return true;
	if (table.rows[0].cells[cellNo].innerHTML.indexOf("return") >= 0) return true;
	
	return false;
}

// move to a specified row
function moveToLine(rowNum) {
	var newRow;
	var cell;

	codeTable.deleteRow(selRow);				// delete the current selected row
	newRow = codeTable.insertRow(rowNum);		// insert a new row at row number specified
	cell = newRow.insertCell(0);				// insert a new cell in new row just created
	cell.innerHTML = innerTableArrowTemplate;	// insert the innerTable template with array
	selectRow(rowNum);	// make this the new selected row
		
	refreshLineCount();							// refresh the line count along the side
}

// highlight one cell red at a specific row and column
function highlightCell(rowInd, colInd) {
	var innerTable = codeTable.rows[rowInd].cells[0].children[0];	// grab the inner table at the specified row
	innerTable.rows[0].cells[colInd].style.color = "#FF0000";		// color the cell red at specific column
}

// highlightControlStructure() looks for matching braces '{' and '}'. Once the braces match up. it stops highlighting
function highlightControlStructure(rowInd, colInd) {
	var bracket = 1;			// bracket found initialized to 1 so the while loops executes
	var numCells;				// number of cells in the current row
	var firstBrack = false;		// first bracket found flag; since bracket is initialized to one, the first bracket doesn't count
	
	for (var i = rowInd; i < codeTable.rows.length; i++) {								// iterate throughout rows starting at the specified index
		var innerTable = codeTable.rows[i].cells[0].children[0];						// grab the inner table of this row
		var numCells = innerTable.rows[0].cells.length									// grab the number of cells in this row
		for (var j = 0; j < numCells; j++) {											// iterate throughout these cells
			if (innerTable.rows[0].cells[j].innerText.indexOf("{") >= 0) {				// if we found a '{'
				if (!firstBrack) firstBrack = true;										// if this is the first bracket, skip it
				else bracket++;															// otherwise, count it
			}
			else if (innerTable.rows[0].cells[j].innerText.indexOf("}") >= 0) {			// if we found a '}'
				bracket--;																// subtract from bracket
			}
			
			innerTable.rows[0].cells[j].style.color = "#FF0000";						// color the current cell red as we go
		}
		if (bracket == 0) break;														// if we found matching brackets, brackets will be 0, break
	}
}

// highlightControlStructureBackwards() looks for match braces '{' and '}' backwards: the same as function above (almost)
function highlightControlStructureBackwards(rowInd, colInd) {
	var bracket = 1;
	var numCells;
	var firstBrack = false;
	var firstLoop = true;			// a flag to see if we are on the first loop
	var i;
	var innerTable;
	
	for (i = rowInd; i >= 0; i--) {													// iterate starting at the specified row index
		innerTable = codeTable.rows[i].cells[0].children[0];						// grab the inner table for this row
		numCells = innerTable.rows[0].cells.length									// get the number of cells in this row
		for (var j = numCells - 1; j >= 0; j--) {									// start at num cells - 1
			if (firstLoop == true) { j = colInd; firstLoop = false; }				// if its the first loop, start at the specified column index

			if (innerTable.rows[0].cells[j].innerText.indexOf('{') >= 0) {			// if the cell contains '{', subtract from bracket
				bracket--;
			}
			else if (innerTable.rows[0].cells[j].innerText.indexOf('}') >= 0) {		// if the cell contains '}'
				if (!firstBrack) firstBrak = true;									// if its the first bracket, don't count it
				else bracket++;														// otherwise, count it
			}
			
			innerTable.rows[0].cells[j].style.color = "#FF0000";					// color the cells along the way
		}
		
		if (bracket == 0) break;													// break if bracket reaches 0
	}
	
	// we need to color the row right above where we started as this line contains the actual control structure
	innerTable = codeTable.rows[i - 1].cells[0].children[0];									// grab the row right before where we stopped
	numCells = innerTable.rows[0].cells.length;													// grab the number of cells in that row
	for (var k = 0; k < numCells; k++) innerTable.rows[0].cells[k].style.color = "#FF0000";		// color the row red
}

// highlightParenthesis() functions similarly to highlightControlStructure(); highlights parenthesis passed to it '(' and ')'
function highlightParenthesis(openBracket, closeBracket, rowInd, colInd) {
	var bracket = 1;
	var numCells;
	var firstBrack = false;
	var firstLoop = true;
	var innerTable;
	
	while (bracket != 0) {
		for (var i = 0; i < codeTable.rows.length; i++) {
			if (firstLoop == true) i = rowInd;
			innerTable = codeTable.rows[i].cells[0].children[0];
			numCells = innerTable.rows[0].cells.length
			for (var j = 0; j < numCells; j++) {
				if (firstLoop == true) { j = colInd; firstLoop = false; }
				
				if (innerTable.rows[0].cells[j].innerText.indexOf(openBracket) >= 0) {
					if (!firstBrack) firstBrack = true;
					else bracket++;
				}
				else if (innerTable.rows[0].cells[j].innerText.indexOf(closeBracket) >= 0) {
					bracket--;
				}
				
				innerTable.rows[0].cells[j].style.color = "#FF0000";
				
				if (bracket == 0) break;
			}
			
			if (bracket == 0) break;
		}
	}
}

// highlightParenthesisBackwards() functions similarly to highlightControlStructureBackwards()
function highlightParenthesisBackwards(openBracket, closeBracket, rowInd, colInd) {
	var bracket = 1;
	var numCells;
	var firstBrack = false;
	var firstLoop = true;
	var innerTable;
	
	while (bracket != 0) {
		for (var i = codeTable.rows.length - 1; i >= 0; i--) {
			if (firstLoop == true) i = rowInd;
			innerTable = codeTable.rows[i].cells[0].children[0];
			numCells = innerTable.rows[0].cells.length
			for (var j = numCells - 1; j >= 0; j--) {
				if (firstLoop == true) { j = colInd; firstLoop = false; }
				
				if (innerTable.rows[0].cells[j].innerText.indexOf(openBracket) >= 0) {
					bracket--;
				}
				else if (innerTable.rows[0].cells[j].innerText.indexOf(closeBracket) >= 0) {
					if (!firstBrack) firstBrack = true;
					else bracket++;
				}
				
				innerTable.rows[0].cells[j].style.color = "#FF0000";
				
				if (bracket == 0) break;
			}
			
			if (bracket == 0) break;
		}
	}
}

// highlightLine() simply highlights the row with the row index passed to it
function highlightLine(rowInd, colInd) {
	var innerTable = codeTable.rows[rowInd].cells[0].children[0];	// grab the inner table at this index
	var numCells = innerTable.rows[0].cells.length;					// grab the number of cells for this row
	for (var i = 0; i < numCells; i++) {							// iterate throughout the cells
		innerTable.rows[0].cells[i].style.color = '#FF0000';		// highlight all cells red
	}
}

// addVariable() is responsible for adding a variable/array declaration
function addVariable(element) {
	var row;
	var cell;
	var innerTable;
	
	if (variableCount == 0) {															// if there are no variables initialized yet
		for (var i = 0; i < 2; i++) {													// iterate twice
			row = codeTable.insertRow(variableCount + 2 + i);							// insert a new row at variableCount + 2 + i (two lines for '// Scratch Pad' and blank line following)
			cell = row.insertCell(0);													// insert a new cell here
			cell.innerHTML = innerTableTemplate;										// put the innerTableTemplate in the new cell
			innerTable = codeTable.rows[variableCount + 2 + i].cells[0].children[0];	// grab the innerTable object we just created
			
			if (i == 0) addRow(innerTable, [ "//&nbsp;", "Variables" ], 2);				// the first iteration: add '// Variables'
			else if (i == 1) addRow(innerTable, [ "&nbsp;" ], 2);						// the second iteration: add a blank line
		
			programStart++;	// increase the program start line
			selRow++;		// increase the selected row
		}
	}

	var row = codeTable.insertRow(variableCount + 3);							// insert a new row for the actual declaration; (variableCount + 3) because of '// Scratch Pad', blank line, and '//Variables'
	var cell = row.insertCell(0);												// insert a new cell at the row
	cell.innerHTML = innerTableTemplate;										// insert our inner table template
	var innerTable = codeTable.rows[variableCount + 3].cells[0].children[0];	// grab the inner table object we just created
	
	// if the element is a variable
	if (element == "variable") {
		addRow(innerTable, ["<b>var</b>&nbsp;", "ID", ";&nbsp;", "&nbsp;//", "&nbsp;TYPE" ], 2);	// add the row
		addRowStyle(innerTable, [ blue, black, black, green, green ], 2);							// style the row accordingly
	}
	else if (element == "array") {	// if its an array
		addRow(innerTable, ["<b>var</b>&nbsp;", "ID", "&nbsp;=&nbsp;", "<b>new</b>&nbsp;", "Array", "(", "size", ")", ";", "&nbsp;//&nbsp", "TYPE"], 2);	// add the row
		addRowStyle(innerTable, [ blue, black, black, blue, black, black, black, black, black, green, green ], 2);											// style it accordingly
	}
	
	selRow++;			// increase the selected row
	variableCount++;	// increase the variable count
	programStart++;		// increase the program start line
	toggleEvents();		// toggle events to refresh the newly created row
	refreshLineCount();	// refresh the line count
}

// addOneLineElement() is responsible for adding elements that only require one line (excluding variable and array declarations)
function addOneLineElement(element) {
	//if this is the very first move to add to the main program, add the main program comment
	if (!firstMove) {
		addMainProgramComment();
		firstMove = true;
	}
	
	var indentStr = findIndentation(selRow);	// get the correct indentation
	
	var row = codeTable.insertRow(selRow);		// get the selected row from the main codeTable
	var cell = row.insertCell(0);				// make a new cell here
	cell.innerHTML = innerTableTemplate;		// put our inner table template in the new cell
	var innerTable = codeTable.rows[selRow].cells[0].children[0];	// grab the inner table over we just created
	
	// depending on which element it is, format the row correspondingly
	if (element == "assignment") addRow(innerTable, [ indentStr + "ID&nbsp;", "=&nbsp", "EXPR", ";"], 2);
	else if (element == "write") addRow(innerTable, [ indentStr + "document.write(", "EXPR", ")", ";" ], 2);
	else if (element == "writeln") addRow(innerTable, [ indentStr + "document.writeln(", "EXPR", ")", ";" ], 2);
	else if (element == "stringPrompt") addRow(innerTable, [ indentStr + "ID&nbsp;", "=&nbsp;", "prompt(", "EXPR", ",&nbsp;", "EXPR", ")", ";" ], 2);
	else if (element == "numericPrompt") addRow(innerTable, [ indentStr + "ID&nbsp;", "=&nbsp;", "parseFloat(", "prompt(", "EXPR", ",", "EXPR", ")", ")", ";" ], 2);
	else if (element == "functionCall") addRow(innerTable, [ indentStr + "FUNCTION(", ")", ";" ], 2);
	else if (element == "return") {
		addRow(innerTable, [ indentStr + "return&nbsp;", "EXPR", ";" ], 2);
		addRowStyle(innerTable, [ "blue", "black", "black" ], 2);
	}
	
	selectRow(selRow+1);				// increase the selected row by one
	
	if (selRow < programStart) programStart++;		// if the selected row is less than the program start line (editing a function), increase program start
	toggleEvents();									// toggle events to refresh them
	refreshLineCount();								// and also refresh line count
}

// addIfThen() is responsible for adding an If/Then control structure
function addIfThen() {
	// if this is the first move the user has made toward the main program, put the main program comment
	if (!firstMove) {
		addMainProgramComment();
		firstMove = true;
	}
	var indentStr = findIndentation(selRow);	// get the correct indentation
	var row;
	var cell;
	var innerTable;
	
	for (var i = 0; i < 3; i++) {											// iterate three times
		row = codeTable.insertRow(selRow + i);								// create a new row at selRow + i
		cell = row.insertCell(0);											// create a new cell in the newly created row
		cell.innerHTML = innerTableTemplate;								// put our inner table template here
		innerTable = codeTable.rows[selRow + i].cells[0].children[0];		// get the newly created inner table object
		
		// add the row on one line, a '{' on the second line, and '}' on the third
		if (i == 0) { addRow(innerTable, [ indentStr + "<b>if</b>&nbsp;", "(", "EXPR", ")" ], 2); addRowStyle(innerTable, [ "blue", "black", "black", "black" ], 2); }
		else if (i == 1) addRow(innerTable, [ indentStr + "{" ], 2);
		else if (i == 2) addRow(innerTable, [ indentStr + "}" ], 2);
	}
	
	selectRow(selRow + 3);								// increase the selected row by 3 (added three items)
	
	if (selRow < programStart) programStart += 3;		// if the selected row is less than the program start (editing a function), increase program start by 3
	toggleEvents();										// toggle events
	refreshLineCount();									// refresh the line count
}

// addIfElse() is very similar to addIfThen() except we add the 'else'
function addIfElse() {
	if (!firstMove) {
		addMainProgramComment();
		firstMove = true;
	}
	var indentStr = findIndentation(selRow);
	var row;
	var cell;
	var innerTable;
	
	for (var i = 0; i < 6; i++) {
		row = codeTable.insertRow(selRow + i);
		cell = row.insertCell(0);
		cell.innerHTML = innerTableTemplate;
		innerTable = codeTable.rows[selRow + i].cells[0].children[0];
		
		if (i == 0) { addRow(innerTable, [ indentStr + "<b>if</b>&nbsp;", "(", "EXPR", ")" ], 2); addRowStyle(innerTable, [ "blue", "black", "black", "black" ], 2); }
		else if (i == 1) addRow(innerTable, [ indentStr + "{" ], 2);
		else if (i == 2) addRow(innerTable, [ indentStr + "}" ], 2);
		else if (i == 3) { addRow(innerTable, [ indentStr + "<b>else</b>" ], 2); addRowStyle(innerTable, [ "blue", ], 2); }
		else if (i == 4) addRow(innerTable, [ indentStr + "{" ], 2);
		else if (i == 5) addRow(innerTable, [ indentStr + "}" ], 2);
	}
	
	selectRow(selRow + 6);
	
	if (selRow < programStart) programStart += 6;
	toggleEvents();
	refreshLineCount();
}

// addWhile() is very similar to adding any other structure
function addWhile() {
	if (!firstMove) {
		addMainProgramComment();
		firstMove = true;
	}
	var indentStr = findIndentation(selRow);
	var row;
	var cell;
	var innerTable;
	
	for (var i = 0; i < 3; i++) {
		row = codeTable.insertRow(selRow + i);
		cell = row.insertCell(0);
		cell.innerHTML = innerTableTemplate;
		innerTable = codeTable.rows[selRow + i].cells[0].children[0];
		
		if (i == 0) { addRow(innerTable, [ indentStr + "<b>while</b>&nbsp;", "(", "EXPR", ")" ], 2); addRowStyle(innerTable, [ "blue", "black", "black", "black" ], 2); }
		else if (i == 1) addRow(innerTable, [ indentStr + "{" ], 2);
		else if (i == 2) addRow(innerTable, [ indentStr + "}" ], 2);
	}
	
	selectRow(selRow + 3);
	
	if (selRow < programStart) programStart += 3;
	toggleEvents();
	refreshLineCount();
}

// addFor() adds a for loop to the current selected line just like addWhile()
function addFor() {
	if (!firstMove) {
		addMainProgramComment();
		firstMove = true;
	}
	var indentStr = findIndentation(selRow);
	var row;
	var cell;
	var innerTable;
	
	for (var i = 0; i < 3; i++) {
		row = codeTable.insertRow(selRow + i);
		cell = row.insertCell(0);
		cell.innerHTML = innerTableTemplate;
		innerTable = codeTable.rows[selRow + i].cells[0].children[0];
		
		if (i == 0) {
			addRow(innerTable, [ indentStr + "<b>for</b>&nbsp;", "(", "ID&nbsp;", "=&nbsp;", "EXPR", ";&nbsp;", "ID&nbsp;", "&lt;&nbsp;", "EXPR", ";&nbsp;", "ID", "++", ")" ], 2);
			addRowStyle(innerTable, [ "blue", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black" ], 2);
		}
		else if (i == 1) addRow(innerTable, [ indentStr + "{" ], 2);
		else if (i == 2) addRow(innerTable, [ indentStr + "}" ], 2);
	}
	
	selectRow(selRow + 3);
	
	if (selRow < programStart) programStart += 3;
	toggleEvents();
	refreshLineCount();
}

// addFunction() adds a new function declaration before the program start and after the variables declarations
function addFunction() {
	var row;
	var cell;
	var innerTable;
	var beginRow;
	
	// if the user hasn't edited the main program OR selected row is less than program start, we begin at the program start line
	if (!firstMove || selRow < programStart) beginRow = programStart;
	else beginRow = programStart - 1;	// otherwise, we begin at programStart - 1
	
	// if we haven't added a function yet, we must insert the '// Functions' comment
	if (funcCount == 0) {
			row = codeTable.insertRow(beginRow);							// add the row at the 'beginRow' index
			cell = row.insertCell(0);
			cell.innerHTML = innerTableTemplate;
			innerTable = codeTable.rows[beginRow].cells[0].children[0];
			
			if (selRow >= beginRow) selRow++;								// increase selected row if it is greater or equal to beginRow
			
			addRow(innerTable, [ "//&nbsp;", "Functions" ], 2);
			addRowStyle(innerTable, [ green, green, ], 2);
			beginRow++;
			
			programStart++;	// increase program start line
	}
	
	// add a blank line at begin row (this creates a blank line after the function declaration)
	row = codeTable.insertRow(beginRow);
	cell = row.insertCell(0);
	cell.innerHTML = innerTableTemplate;
	innerTable = codeTable.rows[beginRow].cells[0].children[0];
	addRow(innerTable, [ "&nbsp;" ], 2);
	programStart++;
	if (selRow >= beginRow) selRow++;
	
	for (var i = 0; i < 3; i++) {											// iterate three times
		row = codeTable.insertRow(beginRow + i);							// create a row at beginRow
		cell = row.insertCell(0);											// insert a new cell in the row
		cell.innerHTML = innerTableTemplate;								// put our inner table template here
		innerTable = codeTable.rows[beginRow + i].cells[0].children[0];		// grab the innerTable object we just created
		
		// add the row on the first iteration, a '{' on second iteration, and a '}' on third iteration
		if (i == 0) {
			addRow(innerTable, [ "<b>function</b>&nbsp;", "ID(", ")&nbsp;", "//&nbsp;", "VOID" ], 2);
			addRowStyle(innerTable, [ blue, black, black, green, green ], 2);
		}
		else if (i == 1) addRow(innerTable, [ "{" ], 2);
		else if (i == 2) addRow(innerTable, [ "}" ], 2);
		
		if (selRow >= beginRow + i) selRow++;	// if the selected row is greater than or equal to the current row, increase selected row
	}
	
	selectRow(selRow);							// make sure the 'selRow' row is selected
	
	programStart += 3;							// increase the program start by 3
	funcCount++;								// increase the function count
	functionList.push("FUNCTION");				// push FUNCTION to the function list
	toggleEvents();								// refresh events
	refreshLineCount();							// refresh the line count
}

// addRow() takes an innerTable, a string of cell values, and a start index and populates the innerTable with these values
function addRow(table, values, startInd) {
	var cell;
	for (var i = 0; i < values.length; i++) {			// for all cells in the table
		cell = table.rows[0].insertCell(startInd++);	// insert a cell at startInd
		cell.innerHTML = values[i];						// make the innerHTML of the cell cells[i]
	}
}

// addRowStyle() takes an innerTable, a string of colors, and a start index and styles the innerTable cells with these colors
function addRowStyle(table, colors, startInd) {
	var cell;
	for (var i = 0; i < colors.length; i++) {			// for all cells in the table
		cell = table.rows[0].cells[startInd++];			// get the cell at the current index
		cell.style.color = colors[i];					// change its style to cells[i]
	}
}

// deleteFunction() checks to see what the element is that is requested to be deleted, and deletes that element
function deleteFunction(rowNum, colNum) {
	var innerTable = codeTable.rows[rowNum].cells[0].children[0];			// grab the inner table that needs to be deleted
	
	if (isOneLineElement(innerTable.rows[0])) deleteOneLineElement(rowNum);	// if its a one line element, delete it
}

// deleteOneLineElement() is responsible for appropriately deleting an element that takes up one line
function deleteOneLineElement(rowNum) {
	if (selRow > rowNum) selRow--;
	if (programStart > rowNum) programStart--;
	
	codeTable.deleteRow(rowNum);
}

// isOneLineElement() checks to see if the row passed is a one line element such as an assignment
function isOneLineElement(row) {
	var rowLength = row.cells.length;
	
	if (rowLength == 6) {
		for (var i = 0; i < rowLength; i++) {
			if (row.cells[i].innerText.indexOf("=") >= 0) { return true; }		// check for assignment
			if (row.cells[i].innerText.indexOf("write") >= 9) { return true; }	// check for a write/writeln
		}
	}
	else if (rowLength == 10) {
		for (var i = 0; i < rowLength; i++) {
			if (row.cells[i].innerText.indexOf("prompt") >= 0) { return true; }	// check for a prompt
		}
	}
	else if (rowLength == 12) {
		for (var i = 0; i < rowLength; i++) {
			if (row.cells[i].innerText.indexOf("prompt") >= 0) { return true; }	// check for a prompt again (numeric prompt)
		}
	}
	else {
		if (row.cells[2].innerText.indexOf("return") >= 0) return true;			// check for a return
		if (row.cells[2].innerText.indexOf("FUNCTION") >= 0) return true;		// check for a function that hasn't been renamed
		if (functionExists(row.cells[2].innerText)) return true;				// check to see if the function exists that has been named
	}
}

// functionExists() returns true or false depending if a function is found in the function list
function functionExists(cellText) {
	for (var i = 0; i < functionList.length; i++) {
		if (cellText.contains(functionList[i])) return true;
	}
	
	return false;
}

// selectRow() selects a row with the specified rowNum
function selectRow(rowNum) {
	if (selRow != -1) {														// if there is a selected row
		var innerTable = codeTable.rows[selRow].cells[0].children[0];		// grab the innerTable for the currently selected row
		innerTable.rows[0].cells[0].innerHTML = blank;						// make its arrow go away (it is no longer selected)
	}
	
	selRow = rowNum;														// make the new selected row to be rowNum
	var innerTable = codeTable.rows[selRow].cells[0].children[0];			// grab its inner table
	innerTable.rows[0].cells[0].innerHTML = arrow;							// make it have an arrow (it is now selected)
}

// findIndentation() returns a string with the appropriate spacing depending on the row number passed to it
// Starting from the top of the code, it finds how many mismatching brackets '{' '}' there are when the row
// is reached. The number of opened brackets without a matching close parenthesis is how many tabs this row
// will need
function findIndentation(row) {
	var bracket = 0;	// number of brackets opened
	for (var i = 0; i < codeTable.rows.length; i++) {								// iterate throughout the code table
		if (i == row) break;														// when the iteration equals the row, stop
		var innerTable = codeTable.rows[i].cells[0].children[0];					// grab the inner table for this row in the code table
		var numCells = innerTable.rows[0].cells.length;								// grab the number of cells in this inner table
		for (var j = 0; j < numCells; j++) {										// iterate throughout the cells
			if (innerTable.rows[0].cells[j].innerText.indexOf('{') >= 0) {			// if an open bracket, add one to bracket
				bracket++;
			}
			else if (innerTable.rows[0].cells[j].innerText.indexOf('}') >= 0) {		// if a close bracket, subtract one from bracket
				bracket--;
			}
		}
	}
	
	// the bracket variable is how many indents we need
	var indents = "";
	for (var i = 0; i < bracket; i++) indents += indent;
	
	return indents;
}

// checkValidRow() makes sure the program doesn't move somewhere that it shouldn't
// For example, we don't want the user moving into the variable sections
function checkValidRow(row, rowNum) {

	if (row.cells[2].innerText.indexOf("//") >= 0) return false;								// don't let the user edit a comment
	if (row.cells[2].innerText == '\xA0') return false;											// don't let the user edit a blank line
	if (row.cells[2].innerText.indexOf("{") >= 0 && rowNum >= programStart) return false;		// don't let the user edit before a '{'
	if (rowNum < variableCount + 3) return false;												// don't let the user edit in the variable space
	
	// the following if statements ensure that a user doesn't edit before the program start (in the variable or function space.. unless its inside a function)
	if ((selRow < programStart && rowNum < programStart + 1) || (rowNum < programStart)) {
		if (row.cells[2].innerText.indexOf("{") >= 0 && selRow > rowNum) return false;
		if (row.cells[2].innerText.indexOf("}") >= 0 && selRow < rowNum) return false;
		if (row.cells[2].innerText.indexOf("function") >= 0) return false;
	}
	return true;
}

// addMainProgramComment() simply adds the main program comment '// Main Program'
function addMainProgramComment() {
	var row = codeTable.insertRow(programStart);
	var cell = row.insertCell(0);
	cell.innerHTML = innerTableTemplate;
	innerTable = codeTable.rows[programStart].cells[0].children[0];
	addRow(innerTable, [ "//&nbsp;", "Main Program" ], 2);
	addRowStyle(innerTable, [ green, green ], 2);
	if (selRow >= programStart) selRow++;
	programStart++;
	firstMove = false;
}

// refreshLineCount() refreshes the line count in the first cell of every inner table
function refreshLineCount() {
	var innerTable;
	for (var i = 0; i < codeTable.rows.length; i++) {
		innerTable = codeTable.rows[i].cells[0].children[0];
		if (i <= 9) innerTable.rows[0].cells[0].innerHTML = i + "&nbsp;";
		else innerTable.rows[0].cells[0].innerText = i;
	}
}

// selectDialogConfirm() has to do with the selecting of options from the jQuery UI (not implemented)
function selectDialogConfirm(result) {
	console.log(result);
}