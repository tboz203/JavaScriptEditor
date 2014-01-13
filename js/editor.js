var codeTable = document.getElementById('editor');
var lineBlank = -1;
var selRow = codeTable.rows.length - 1;
var blank = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
var arrow = "&nbsp;&#8594;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;";
var variableCount = 0;

$("#selectDialog").dialog({
            modal: false,
            autoOpen: false,
            height: 200,
            width: 200,
			position:[300,20],
            buttons: {
                "Okay": function() {
					var dropDown = document.getElementById("dropDown");
					var value = dropDown.options[dropDown.selectedIndex].text;
					
                    selectDialogConfirm(value);
					$(this).dialog("close");
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                }
            },
			open: function (event, ui) {
				$('#selectDialog').css('overflow', 'hidden'); //this line does the actual hiding
			}
    });
	
toggleHover();

function toggleHover() {
	$('.innerTable').off('mouseover');
	
	$('.innerTable').on('mouseover', 'td', function(){
		cellVal = $(this).text();
		colNum = ($(this).index());
		tableNum = ($(this).parent().parent().parent().parent().parent().index());
		
		if (cellVal == "while") {
			highlightControlStructure(tableNum, colNum);
			codeTable.style.cursor = 'pointer';
		}
		else if (cellVal.indexOf('{') >= 0) {
			highlightControlStructure(tableNum, 0);
			codeTable.style.cursor = 'pointer';
		}
		else if (cellVal.indexOf('(') >= 0) {
			highlightBracket('(', ')', tableNum, colNum);
			codeTable.style.cursor = 'pointer';
		}
		else if (cellVal.indexOf('}') >= 0) {
			highlightControlStructureBackwards(tableNum, colNum);
			codeTable.style.cursor = 'pointer';
		}
		else if (cellVal.indexOf(')') >= 0) {
			highlightBracketBackwards('(', ')', tableNum, colNum);
			codeTable.style.cursor = 'pointer';
		}
		else if(cellVal.indexOf('var') >= 0 || cellVal.indexOf(';') >= 0 || cellVal.indexOf('//') >= 0) {
			highlightLine(tableNum, colNum);
		}
		else {
			highlightCell(tableNum, colNum);
		}
	});
	
	$('.innerTable').off('mouseout');
	
	$('.innerTable').on('mouseout', 'td', function(){
		for (var i = 0; i < codeTable.rows.length; i++) {
			var innerTable = codeTable.rows[i].cells[0].children[0];
			var numRows = innerTable.rows[0].cells.length
			for (var j = 0; j < numRows; j++) {
				innerTable.rows[0].cells[j].style.color = "#000000";
			}
		}
		
		codeTable.style.cursor = 'default';
	});
	
	$('.innerTable').off('click');
	
	$(".innerTable").on('click','td',function(e) {
		var cellVal = $(this).text();
		var tableNum = ($(this).parent().parent().parent().parent().parent().index());
		console.log("Row clicked: " + tableNum);
		
		if (selRow == tableNum) return;
		if (tableNum < variableCount) return;
		
		if (cellVal == '\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0') {
			var innerTable = codeTable.rows[selRow].cells[0].children[0];
			moveLineDown(1, tableNum);
		}
		else $("#selectDialog").dialog('open');
		
		console.log("Selected Row: " + selRow);
		console.log("Length: " + codeTable.rows.length);
	}); 
}

function moveLineDown(lines, row) {
	var newRow;
	var cell;

	codeTable.deleteRow(selRow);
	newRow = codeTable.insertRow(row);
	cell = newRow.insertCell(0);
	cell.innerHTML = "<table class='innerTable'><tr><td>" + arrow + "</td></tr></table>";
	selectRow(codeTable.rows[row].cells[0].children[0], row);
		
	selRow = row;
}

function highlightCell(rowInd, colInd) {
	var innerTable = codeTable.rows[rowInd].cells[0].children[0];
	innerTable.rows[0].cells[colInd].style.color = "#FF0000";
}

function highlightControlStructure(rowInd, colInd) {
	var bracket = 1;
	var numRows;
	var firstBrack = false;
	var firstLoop = true;
	
	while (bracket != 0) {
		for (var i = 0; i < codeTable.rows.length; i++) {
			if (firstLoop == true) i = rowInd;
			var innerTable = codeTable.rows[i].cells[0].children[0];
			var numRows = innerTable.rows[0].cells.length
			for (var j = 0; j < numRows; j++) {
				if (firstLoop == true) { j = colInd; firstLoop = false; }

				if (innerTable.rows[0].cells[j].innerText.indexOf("{") >= 0) {
					if (!firstBrack) firstBrack = true;
					else bracket++;
				}
				else if (innerTable.rows[0].cells[j].innerText.indexOf("}") >= 0) {
					bracket--;
				}
				
				innerTable.rows[0].cells[j].style.color = "#FF0000";
			}
			if (bracket == 0) break;
		}
	}
}

function highlightControlStructureBackwards(rowInd, colInd) {
	var bracket = 1;
	//var rowInd = tableNum;
	//var colInd = colNum;
	var numRows;
	var firstBrack = false;
	var firstLoop = true;
	
	while (bracket != 0) {
		for (var i = codeTable.rows.length - 1; i >= 0; i--) {
			if (firstLoop == true) i = rowInd;
			var innerTable = codeTable.rows[i].cells[0].children[0];
			var numRows = innerTable.rows[0].cells.length
			for (var j = numRows - 1; j >= 0; j--) {
				if (firstLoop == true) { j = colInd; firstLoop = false; }

				if (innerTable.rows[0].cells[j].innerText.indexOf('{') >= 0) {
					bracket--;
				}
				else if (innerTable.rows[0].cells[j].innerText.indexOf('}') >= 0) {
					if (!firstBrack) firstBrak = true;
					else bracket++;
				}
				
				innerTable.rows[0].cells[j].style.color = "#FF0000";
			}
			
			if (bracket == 0) break;
		}
	}
}

function highlightBracket(openBracket, closeBracket, rowInd, colInd) {
	var bracket = 1;
	var numRows;
	var firstBrack = false;
	var firstLoop = true;
	
	while (bracket != 0) {
		for (var i = 0; i < codeTable.rows.length; i++) {
			if (firstLoop == true) i = rowInd;
			var innerTable = codeTable.rows[i].cells[0].children[0];
			var numRows = innerTable.rows[0].cells.length
			for (var j = 0; j < numRows; j++) {
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

function highlightBracketBackwards(openBracket, closeBracket, rowInd, colInd) {
	var bracket = 1;
	var numRows;
	var firstBrack = false;
	var firstLoop = true;
	
	while (bracket != 0) {
		for (var i = codeTable.rows.length - 1; i >= 0; i--) {
			if (firstLoop == true) i = rowInd;
			var innerTable = codeTable.rows[i].cells[0].children[0];
			var numRows = innerTable.rows[0].cells.length
			for (var j = numRows - 1; j >= 0; j--) {
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

function highlightLine(rowInd, colInd) {
	var innerTable = codeTable.rows[rowInd].cells[0].children[0];
	var numRows = innerTable.rows[0].cells.length;
	for (var i = 1; i < numRows; i++) {
		innerTable.rows[0].cells[i].style.color = '#FF0000';
	}
}

function addVariable() {
	var row = codeTable.insertRow(variableCount);
	var cell = row.insertCell(0);
	cell.innerHTML = "<table class='innerTable'><tr><td>" + blank + "</td></tr></table>";
	
	var innerTable = codeTable.rows[variableCount].cells[0].children[0];
	addRow(innerTable, ["var&nbsp;", "ID", ";&nbsp;", "&nbsp;//", "&nbsp;TYPE" ], 1);
	
	selRow++;
	variableCount++;
	toggleHover();
	console.log("Length: " + codeTable.rows.length);
}

function addArray() {
	var row = codeTable.insertRow(variableCount);
	var cell = row.insertCell(0);
	cell.innerHTML = "<table class='innerTable'><tr><td>" + blank + "</td></tr></table>";
	
	var innerTable = codeTable.rows[variableCount].cells[0].children[0];
	addRow(innerTable, ["var&nbsp;", "ID", "&nbsp;=&nbsp;", "new&nbsp;", "Array", "(", "size", ")", ";", "&nbsp;//&nbsp", "TYPE"], 1);
	
	selRow++;
	variableCount++;
	toggleHover();
	console.log("Length: " + codeTable.rows.length);
}

function addAssignment(table, cells, startInd) {
	// find the correct indention
	
	var row = codeTable.insertRow(selRow);
	var cell = row.insertCell(0);
	cell.innerHTML = "<table class='innerTable'><tr><td>" + blank + "</td></tr></table>";
	
	var innerTable = codeTable.rows[selRow].cells[0].children[0];
	addRow(innerTable, ["ID&nbsp;", "=&nbsp", "EXPR", ";"], 1);
	
	selectRow(innerTable, selRow+1);
	
	lineBlank++;
	toggleHover();
}

function addRow(table, cells, startInd) {
	var cell;
	for (var i = 0; i < cells.length; i++) {
		cell = table.rows[0].insertCell(startInd++);
		cell.innerHTML = cells[i];
	}
}

function selectRow(innerTable, rowNum) {
	if (selRow != -1) {
		var innerTable = codeTable.rows[selRow].cells[0].children[0];
		innerTable.rows[0].cells[0].innerHTML = blank;
	}
	
	selRow = rowNum;
	var innerTable = codeTable.rows[selRow].cells[0].children[0];
	innerTable.rows[0].cells[0].innerHTML = arrow;
}

function selectDialogConfirm(result) {
	console.log(result);
}