﻿(function () {
    "use strict";

    var cellToHighlight;
    var messageBanner;

    class room {
        constructor(tiles, doors, title) {
            this.tiles = tiles;
            this.doors = doors;
            this.title = title;
        }
    }

    let startTiles = [
        ['f', 'f', 'f', 'c', 'f', 'f', 'k'],
        ['f', 'c', 'f', 'c', 'f', 'c', 'f'],
        ['f', 'c', 'f', 'c', 'f', 'c', 'f'],
        ['f', 'c', 'f', 'c', 'f', 'c', 'f'],
        ['f', 'c', 'f', 'c', 'f', 'c', 'f'],
        ['w', 'f', 'f', 'f', 'f', 'f', 'w'],
        ['w', 'w', 'w', 'w', 'w', 'w', 'w']
    ];

    var startRoom = new room(startTiles, [true, true, false, true], "Start Room");

    // The initialize function must be run each time a new page is loaded.
    Office.initialize = function (reason) {
        $(document).ready(function () {
            // Initialize the notification mechanism and hide it
            var element = document.querySelector('.MessageBanner');
            messageBanner = new components.MessageBanner(element);
            messageBanner.hideBanner();
            
            // If not using Excel 2016, use fallback logic.
            if (!Office.context.requirements.isSetSupported('ExcelApi', '1.1')) {
                $("#template-description").text("Emergus Questivo. An adventure through the Portal Dimension of the Wizard weNnoR. Find three keys (ᚩ)");
                $('#button-text').text("weNnoR!");
                $('#button-desc').text("weNnoR!!!!");

                $('#highlight-button').click(roomRender);
                return;
            }

            $("#template-description").text("Navigate your way through the Wizard weNnoR's realm. Find three keys (ᚩ)");
            $('#button-text').text("Do the Nothing!");
            $('#button-desc').text("Highlights the largest number.");

            setCellSizes();
            //loadSampleData();

            // Add a click event handler for the highlight button.
            $('#highlight-button').click(roomRender);
        });
    };

    function setCellSizes() {
        Excel.run(function (ctx) {
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRanges("a1:k11");

            var internalRange = sheet.getRanges("c3:i9");
            cellRange.format.fill.color = "black";
            internalRange.format.fill.color = "yellow";
            cellRange.format.columnWidth = 20;
            cellRange.format.rowHeight = 20;

            return ctx.sync();
        }).catch(errorHandler);
    }

    //Render rooms with a 2 cell pad on top and left sides (top left room edge starts at Row 3, Column C)
    function roomRender(newRoom) {
        newRoom = startRoom;

        Excel.run(function (ctx) {
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRange("c3:i9");
            cellRange.load("value, rowCount, columnCount");

            return ctx.sync().then(function () {
                for (var i = 0; i < cellRange.rowCount; i++) {
                    for (var j = 0; j < cellRange.columnCount; j++) {
                        switch (newRoom.tiles[i][j]) {
                            case 'f':
                                cellRange.getCell(i, j).format.fill.color = "brown";
                                break;
                            case 'w':
                                cellRange.getCell(i, j).format.fill.color = "blue";
                                break;
                            case 'c':
                                cellRange.getCell(i, j).format.fill.color = "black";
                                break;
                            case 'k':
                                cellRange.getCell(i, j).format.fill.color = "brown";
                                cellRange.getCell(i, j).value = 'ᚩ';
                                cellRange.getCell(i, j).font.color = "pink";
                                break;
                            default:
                                cellRange.getCell(i, j).format.fill.color = "black";
                                break;
                        }
                    }
                }
            }).then(ctx.sync);
                
        }).catch(errorHandler);
    }

    function loadSampleData() {
        var values = [
            [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)],
            [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)],
            [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)]
        ];

        // Run a batch operation against the Excel object model
        Excel.run(function (ctx) {
            // Create a proxy object for the active sheet
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            // Queue a command to write the sample data to the worksheet
            sheet.getRange("B3:D5").values = values;

            // Run the queued-up commands, and return a promise to indicate task completion
            return ctx.sync();
        })
        .catch(errorHandler);
    }

    function hightlightHighestValue() {
        // Run a batch operation against the Excel object model
        Excel.run(function (ctx) {
            // Create a proxy object for the selected range and load its properties
            var sourceRange = ctx.workbook.getSelectedRange().load("values, rowCount, columnCount");

            // Run the queued-up command, and return a promise to indicate task completion
            return ctx.sync()
                .then(function () {
                    var highestRow = 0;
                    var highestCol = 0;
                    var highestValue = sourceRange.values[0][0];

                    // Find the cell to highlight
                    for (var i = 0; i < sourceRange.rowCount; i++) {
                        for (var j = 0; j < sourceRange.columnCount; j++) {
                            if (!isNaN(sourceRange.values[i][j]) && sourceRange.values[i][j] > highestValue) {
                                highestRow = i;
                                highestCol = j;
                                highestValue = sourceRange.values[i][j];
                            }
                        }
                    }

                    cellToHighlight = sourceRange.getCell(highestRow, highestCol);
                    sourceRange.worksheet.getUsedRange().format.fill.clear();
                    sourceRange.worksheet.getUsedRange().format.font.bold = false;

                    // Highlight the cell
                    cellToHighlight.format.fill.color = "orange";
                    cellToHighlight.format.font.bold = true;
                })
                .then(ctx.sync);
        })
        .catch(errorHandler);
    }

    function displaySelectedCells() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    showNotification('The selected text is:', '"' + result.value + '"');
                } else {
                    showNotification('Error', result.error.message);
                }
            });
    }

    // Helper function for treating errors
    function errorHandler(error) {
        // Always be sure to catch any accumulated errors that bubble up from the Excel.run execution
        showNotification("Error", error);
        console.log("Error: " + error);
        if (error instanceof OfficeExtension.Error) {
            console.log("Debug info: " + JSON.stringify(error.debugInfo));
        }
    }

    // Helper function for displaying notifications
    function showNotification(header, content) {
        $("#notification-header").text(header);
        $("#notification-body").text(content);
        messageBanner.showBanner();
        messageBanner.toggleExpansion();
    }
})();
