﻿(function () {
    "use strict";

    /*
     *  Anthony Smith - CST230
     *  Kyle Wei - CST234
     *  Dungeon of weNnoR
     *  COET295
     * */
    var cellToHighlight;
    var messageBanner;

    class room {
        constructor(tiles, doors, title, desc, it) {
            this.tiles = tiles;
            this.doors = doors;
            this.title = title;
            this.description = desc;
            this.items = it;
        }
    }

    //Tracking the player icon's position
    var playerPos = [3, 4];

    //Array list of room objects
    var roomList = [];

    //Tracks the current active room
    var currentRoom = null;

    //Array of inventory values
    var inventory = [];

    var hidden = false;

    // The initialize function must be run each time a new page is loaded.
    Office.initialize = function (reason) {
        $(document).ready(function () {
            // Initialize the notification mechanism and hide it
            var element = document.querySelector('.MessageBanner');
            messageBanner = new components.MessageBanner(element);
            messageBanner.hideBanner();
            
            // If not using Excel 2016, use fallback logic.
            if (!Office.context.requirements.isSetSupported('ExcelApi', '1.1')) {
                $("#template-description").text("An adventure through the Portal Dimension of the Wizard weNnoR. Find three keys (F) to open the door to freedom!");
                $('#button-text').text("weNnoR!");
                $('#button-desc').text("weNnoR!!!!");
                $('#highlight-button').click(roomRender);
                return;
            }

            //setCellSizes();
            roomList = makeRooms();
            //loadSampleData();
            currentRoom = roomList[0];
            moveRoom(currentRoom);
            hidden = false;
            inventory = [];

            $("#template-description").text("Navigate your way through the Wizard weNnoR's realm. Find three keys (ᚩ)");
            $('#btn-boss-text').text("Hide! Ron is coming!");

            $('#btn-up-text').text("Up");
            $('#btn-up').click(function () {
                move('u', currentRoom);
            });

            $('#btn-down-text').text("Down");
            $('#btn-down').click(function () {
                move('d', currentRoom);
            });

            $('#btn-left-text').text("Left");
            $('#btn-left').click(function () {
                move('l', currentRoom);
            });

            $('#btn-right-text').text("Right");
            $('#btn-right').click(function () {
                move('r', currentRoom);
            });

            $('#controlDiv').css("display", "flex");
            $('#controlDiv').css("flex-direction", "column");
            $('#controlDiv').css("align-items", "center");
            $('#controlDiv > div > button').css("padding", "0.25em");
            $('#controlDiv > div > button').css("margin", "0.25em");

            $('#descriptionText').css("font-size", "1.25em");
            $('#invText').css("font-size", "1.25em");
            $('#invText').css("font-weight", "bold");

            // Add a click event handler for the highlight button.
            $('#btn-boss').click(function ()
            {
                Excel.run(function (ctx)
                {
                    hidden = !hidden;
                    var sheets = ctx.workbook.worksheets;
                    if (hidden)
                    {
                        sheets.add("WORK");

                        var currentSheet = ctx.workbook.worksheets.getActiveWorksheet();
                        currentSheet.activate();
                        makeTable();
                        currentSheet.visibility = Excel.SheetVisibility.hidden
                    }
                    else
                    {
                        var gameSheet = ctx.workbook.worksheets.getItem(currentRoom.title);
                        gameSheet.visibility = Excel.SheetVisibility.visible;
                        gameSheet.activate();
                        ctx.workbook.worksheets.getItem("WORK").delete();
                    }

                    return ctx.sync();
                }).catch(errorHandler);
            });
        });
    };

    //Creates and populates a table of students and their marks (for the "hide from Ron" page)
    function makeTable()
    {
        Excel.run(function (ctx)
        {
            var sheet = ctx.workbook.worksheets.getItem("WORK");
            var marksTable = sheet.tables.add("A1:F1", true);
            marksTable.name = "Marks";

            //The header for the table
            marksTable.getHeaderRowRange().values = [["Student", "Assign1", "Assign2", "Midterm", "Final", "Average"]];

            //The completely accurate classlist
            var namesList = [
                "Anthony Smith",
                "Kyle Wei",
                "Evan Knouse",
                "Rick Caron",
                "Joel Sipes",
                "Matthew Smith",
                "Jon Ronn",
                "Jessie Smith",
                "Jann the Man",
                "Nathan Kappel",
                "Nathan Balaniuk",
                "Brennan Balaniuk",
                "Bubba Chabot",
                "Aaron Atkinson",
                "Carson Kearns",
                "Simon Gilmour",
                "Hugh Ullrich",
                "Jordan Knodel",
                "Matthew Heagy",
                "Brett Hickie",
                "Tara Epp",
                "Logan Olfert",
                "Kory Prior",
                "Ronald MacDonald",
                "Steve McQueen",
                "Alan Turing"
            ];

            //Assign the marks to the table
            for (var i = 0; i < 25; i++)
            {
                //Determine the marks
                let marks = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];
                //Determine the average
                let avg = (marks[0] + marks[1] + marks[2] + marks[3]) / 4.0;
                //add them to the table
                marksTable.rows.add(null, [[namesList[i], marks[0], marks[1], marks[2], marks[3], avg]]);
            }

            //Autofit the column widths
            if (Office.context.requirements.isSetSupported("ExcelApi", "1.2"))
            {
                sheet.getUsedRange().format.autofitColumns();
                sheet.getUsedRange().format.autofitRows();
            }

            //Sort the marks by first name
            var sortRange = marksTable.getDataBodyRange();

            sortRange.sort.apply([
                {
                    key: 0,
                    ascending: true,
                }
            ]);

            return ctx.sync();
        });
    }

    //Changing the current room.
    function moveRoom(newRoom) {
        Excel.run(function (ctx)
        {

            var sheets = ctx.workbook.worksheets;
            //var newSheet = sheets.add(newRoom.title);
            sheets.load("items/name");
            var currentSheet = ctx.workbook.worksheets.getActiveWorksheet();
            currentSheet.load("name");
            $('#roomTitle').text(newRoom.title);
            console.log(newRoom.description);
            $('#roomDesc').html(newRoom.description);
            //newSheet.activate();
            //currentSheet.delete();
            currentSheet.onSelectionChanged.add(function (event)
            {
                $('#descriptionText').val("I sure hope you aren't trying to cheat");
            });

            setCellSizes();

            return ctx.sync().then(function ()
            {
                currentSheet.name = newRoom.title;
                roomRender(newRoom);
                currentRoom = newRoom;
            });
        }).catch(errorHandler);
    }

    // Resizes the cells of the play area so that they are (more or less) square.
    function setCellSizes() {
        Excel.run(function (ctx) {
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRanges("a1:k11");

            var internalRange = sheet.getRanges("c3:i9");
            cellRange.format.fill.color = "White";
            internalRange.format.fill.color = "yellow";
            cellRange.format.columnWidth = 20;
            cellRange.format.rowHeight = 20;
            cellRange.format.horizontalAlignment = "Center";
            cellRange.format.verticalAlignment = "Center";
            cellRange.format.font.size = 15;
            cellRange.format.font.color = "Black";
            return ctx.sync();
        }).catch(errorHandler);
    }

    //Render rooms with a 2 cell pad on top and left sides (top left room edge starts at Row 3, Column C)
    function roomRender(newRoom) {
        Excel.run(function (ctx) {
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRange("b2:j10");
            cellRange.load("value, rowCount, columnCount");

            var itemRange = sheet.getRange("c3:i9");
            itemRange.load("value");

            return ctx.sync().then(function () {
                for (var i = 0; i < cellRange.rowCount; i++) {
                    for (var j = 0; j < cellRange.columnCount; j++)
                    {
                        //Get reference to current cell
                        var currentCell = cellRange.getCell(i, j);

                        //Empties cell value during render
                        if (currentCell.value != '')
                        {
                            currentCell.values = '';
                        }

                        switch (newRoom.tiles[i][j]) {
                            case 0:
                                currentCell.format.fill.color = "Black";
                                break;
                            case 1:
                                currentCell.format.fill.color = "LightGrey"; //#D3D3D3
                                break;
                            case 2:
                                currentCell.format.fill.color = "AntiqueWhite"; //#FAEBD7
                                break;
                            case 3:
                                currentCell.format.fill.color = "DodgerBlue"; //#1E90FF
                                break;
                            case 4:
                                currentCell.format.fill.color = "SaddleBrown"; //#8B4513
                                break;
                            case 5:
                                currentCell.format.fill.color = "Yellow"; //#FFFF00
                                break;
                            case 6:
                                currentCell.format.fill.color = "Purple"; //#800080
                                break;
                            case 7:
                                currentCell.format.fill.color = "GreenYellow";
                                break;
                            default:
                                currentCell.format.fill.color = "black";
                                break;
                        }
                    }
                }

                //Populate items
                if (newRoom.items.length > 0)
                {
                    newRoom.items.forEach(function (itemEntry)
                    {
                        itemRange.getCell(itemEntry.row, itemEntry.col).values = itemEntry.item;
                    });
                }

                //Display the player
                cellRange.getCell(playerPos[0], playerPos[1]).values = '☺';
            }).then(ctx.sync);
                
        }).catch(errorHandler);
    }

    //Handles player movement checks and room transition checks
    //If tiles are "Floor" or "Sand" coloured, player icon move is applied
    //If tiles are a "Door" tile, move room is applied
    function move(direction, currentRoom) {
        var newPos = [-1, -1];
        var doorVal = -1;

        switch (direction) {
            case 'u':
                if (playerPos[0] > 0) {
                    newPos = [playerPos[0] - 1, playerPos[1]];
                    doorVal = 0;
                }
                break;
            case 'd':
                if (playerPos[0] < 8) {
                    newPos = [playerPos[0] + 1, playerPos[1]];
                    doorVal = 2;
                }
                break;
            case 'l':
                if (playerPos[1] > 0) {
                    newPos = [playerPos[0], playerPos[1] - 1];
                    doorVal = 3;
                }
                break;
            case 'r':
                if (playerPos[1] < 8) {
                    newPos = [playerPos[0], playerPos[1] + 1];
                    doorVal = 1;
                }
                break;
            default:
                break;
        }
        Excel.run(function (ctx) {
            var action = -1;
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRange("b2:j10");
            var cell = cellRange.getCell(newPos[0], newPos[1]);
            cell.load("values, format/fill/color");

            return ctx.sync()
                .then(function ()
                {
                    if (cell.values[0] != "")
                    {
                        action = 2;
                    }
                    else
                    {
                        switch (cell.format.fill.color)
                        {
                            case "#D3D3D3":
                                action = 0;
                                break;
                            case "#FAEBD7":
                                action = 0;
                                break;
                            case "#FFFF00":
                                action = 1;
                                break;
                            case "#1E90FF":
                                if ($('#invText').val().includes("J"))
                                {
                                    action = 3;
                                    $('#descriptionText').val("Swimming!");
                                }
                                else
                                {
                                    $('#descriptionText').val("You'd likely run out of breath before you reached the other side");
                                }
                                break;
                            case "#800080":
                                let keyCount = 0;
                                let keysFound = $('#invText').val().match(/F/g);

                                if (keysFound != null)
                                {
                                    keyCount = keysFound.length;
                                }

                                if (keyCount < 3)
                                {
                                    $('#descriptionText').val("Large, stone, ornate doors bar your route to freedom. As you inspect the door you find three keyholes, and many long dried, bloody scratches marks");
                                }
                                else
                                {
                                    action = 1;
                                }
                                break;
                        }
                    }
                        
                    switch (action) {
                        case 0:
                            movePlayerIcon(newPos[0], newPos[1]);
                            $('#descriptionText').val("");
                            break;
                        case 1:
                            moveRoom(roomList[currentRoom.doors[doorVal]]);
                            $('#descriptionText').val("");
                            switch (doorVal) {
                                case 0:
                                    playerPos = [7, 4];
                                    break;
                                case 1:
                                    playerPos = [4, 1];
                                    break;
                                case 2:
                                    playerPos = [1, 4];
                                    break;
                                case 3:
                                    playerPos = [4, 7];
                                    break;
                            }
                            break;
                        case 2:
                            interact(cell.values[0], newPos);
                            break;
                        case 3:
                            movePlayerIcon(newPos[0], newPos[1]);
                            $('#descriptionText').val("Swimming!");
                            break;
                        default:
                            break;
                    }
                })
                .then(ctx.sync);
        });
    }

    function interact(item, newPos)
    {
        let sDesc = "";
        let sInv = $('#invText').val();
        let bRemove = false;
        let bWennoR = false;
        switch (item[0])
        {
            case '☺':
                sDesc = "An aspiring wizard who looks terribly stressed and sleep deprived. Listening closely, you hear them mumble \"Tsc fo daeh eht si weNnoR\". Spooky stuff.";
                break;
            case '☻':
                sDesc = "A stone statue of an older wizard clothed in long robes.";
                break;
            case 'i':
                sDesc = "A wooden torch with a bright flame illuminating the surrounding area";
                break;
            case 'F':
                sInv += item[0] + " ";
                bRemove = true;
                break;
            case 'J':
                sDesc = "A set of goggles and a long not-plastic tube with a seal around one end. This could be useful if you need to breathe underwater";
                sInv += item[0] + " ";
                bRemove = true;
                break;
            case '╤':
                sDesc = "Long, grey, and covered in drawings. Your standard classroom table";
                break;
            case 'W':
                sDesc = "A tall, bespectacled man wearing grey robes. This must be Grand Wizard weNnoR. As you approach him, he asks the class \"What's the difference between a kiss-ass and a brown-noser?\"";
                break;
            case '∩':
                sDesc = "A wooden bed. It's not naptime yet!"
                break;
            default:
                break;
        }
        
        if (bRemove)
        {
            let keyMatch = sInv.match(/F/g);
            console.log(keyMatch);
            var itemArray = currentRoom.items.filter((it) => it.item != "F" && it.item != "J");
            currentRoom.items = itemArray;
            //Key count check for unlocking weNnoR's room
            if (keyMatch != null && keyMatch.length >= 3)
            {
                roomList[4].tiles[8][4] = 5;
                sDesc = "As you pick up the final key, you hear a loud CLANK from somewhere in the labyrinth. Something else may have opened which wasn't there before";
            }
            else
            {
                sDesc = "A heavy iron key with strange markings engraved into it";
            }

            $('#invText').val(sInv);
            
            Excel.run(function (ctx)
            {
                var sheet = ctx.workbook.worksheets.getActiveWorksheet();
                var sheet = ctx.workbook.worksheets.getActiveWorksheet();
                var cellRange = sheet.getRange("b2:j10");

                return ctx.sync().then(function ()
                {
                    cellRange.getCell(newPos[0], newPos[1]).values = '';

                }).then(ctx.sync);
            }).catch(errorHandler);
        }

        $('#descriptionText').val(sDesc);
    }

    //Helper function for moving the player icon and updating the player position
    function movePlayerIcon(newRow, newCol) {
        Excel.run(function (ctx) {
            var sheet = ctx.workbook.worksheets.getActiveWorksheet();
            var cellRange = sheet.getRange("b2:j10");

            return ctx.sync().then(function () {
                cellRange.getCell(playerPos[0], playerPos[1]).values = '';
                playerPos[0] = newRow;
                playerPos[1] = newCol;
                cellRange.getCell(playerPos[0], playerPos[1]).values = '☺';
            }).then(ctx.sync);
        }).catch(errorHandler);
    }

    //Function used to create all room tiles, their titles, descriptions, and item lists. Adds the rooms to the roomList
    //Called when application/game restarts
    function makeRooms() {

        roomList = [];

        /*
         *  0 = Chasm tile
         *  1 = Floor tile
         *  2 = Sand tile
         *  3 = Water tile
         *  4 = Wall tile
         *  5 = Door tile
         *  6 = Main Exit Tile
         *  7 = Grass tile
         */

        let startTiles = [
            [4, 4, 4, 6, 6, 6, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];
        let startRoomItems = [
            {
                "item": '☻',
                "row": 1,
                "col": 1
            },
            {
                "item": '☻',
                "row": 1,
                "col": 5
            },
            {
                "item": '☻',
                "row": 3,
                "col": 1
            },
            {
                "item": '☻',
                "row": 3,
                "col": 5
            }
        ];
        let startRoomTitle = "Lobby of Freedom";
        let startRoomDesc = "Three keys bar this door, <br\>Three keys, and not one more<br\>I challenge thee to find them,<br\>I, the great Wizard weNnoR!";
        let startRoom = new room(startTiles, [16, -1, 1, -1], startRoomTitle, startRoomDesc, startRoomItems);
        roomList.push(startRoom);

        let roomTwoFourTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 0, 0, 1, 1, 1, 0, 0, 4],
            [4, 0, 0, 1, 0, 1, 0, 0, 4],
            [4, 0, 0, 1, 0, 1, 0, 0, 4],
            [4, 0, 0, 1, 0, 1, 0, 0, 4],
            [4, 0, 0, 1, 1, 1, 0, 0, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];
        let twoFourItems = [];
        let twoFourTitle = "Salvation Bridge";
        let twoFourDesc = "One way leads to terror.\nOne way leads to freedom!";
        let roomTwoFour = new room(roomTwoFourTiles, [0, -1, 5, -1], twoFourTitle, twoFourDesc, twoFourItems);
        roomList.push(roomTwoFour);

        let lonelyIslandTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 3, 3, 2, 2, 2, 3, 3, 4],
            [4, 3, 3, 2, 2, 2, 3, 2, 5],
            [4, 3, 3, 2, 2, 2, 3, 3, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let lonelyIslandItems = [
            {
                "item": 'F',
                "row": 3,
                "col": 3
            }
        ];
        let lonelyIslandTitle = "Lo'n Lee Island";
        let lonelyIslandDesc = "Save the key from its lonely perch";
        let lonelyIslandRoom = new room(lonelyIslandTiles, [-1, 3, -1, -1], lonelyIslandTitle, lonelyIslandDesc, lonelyIslandItems);
        roomList.push(lonelyIslandRoom);

        let tRoomTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 4],
            [5, 2, 2, 1, 1, 1, 1, 1, 5],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 0, 0, 0, 1, 0, 0, 0, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];
        let tRoomItems = [];
        let tRoomTitle = "Intersection of M'ist Urtee";
        let tRoomDesc = "I pity the fool that goes the wrong way!";
        let tRoom = new room(tRoomTiles, [-1, 4, 6, 2], tRoomTitle, tRoomDesc, tRoomItems);
        roomList.push(tRoom);

        let windyRoomTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 1, 1, 1, 3, 1, 1, 1, 4],
            [4, 1, 3, 1, 3, 1, 3, 1, 4],
            [4, 1, 3, 1, 3, 1, 3, 1, 4],
            [5, 1, 3, 1, 3, 1, 3, 1, 5],
            [4, 1, 3, 1, 3, 1, 3, 1, 4],
            [4, 1, 3, 1, 3, 1, 3, 1, 4],
            [4, 3, 3, 1, 1, 1, 3, 3, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let windyRoomItems = [];
        let windyRoomTitle = "Windig Zimmer";
        let windyRoomDesc = "Diese Zimmer ist sehr kurvenrich";
        let windyRoom = new room(windyRoomTiles, [-1, 5, 7, 3], windyRoomTitle, windyRoomDesc, windyRoomItems);
        roomList.push(windyRoom);

        let lungRoomTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1 ,1, 4],
            [4, 1, 1, 0, 0, 0, 1, 1, 4],
            [4, 1, 1, 0, 0, 0, 1, 1, 4],
            [5, 1, 1, 0, 1, 1, 1, 1, 4],
            [4, 1, 1, 0, 0, 0, 1, 1, 4],
            [4, 1, 1, 0, 0, 0, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];

        let lungRoomItems = [];
        let lungRoomTitle = "Breathing Room";
        let lungRoomDesc = "Did you know 100% of people who are exposed to oxygen will die?";
        let lungRoom = new room(lungRoomTiles, [1, -1, 8, 4], lungRoomTitle, lungRoomDesc, lungRoomItems);
        roomList.push(lungRoom);

        let bedRoomTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 4, 1, 4, 1, 1, 4],
            [4, 4, 4, 4, 1, 4, 4, 4, 4],
            [4, 4, 4, 4, 1, 4, 4, 4, 4],
            [4, 4, 4, 4, 1, 4, 4, 4, 4],
            [4, 1, 1, 4, 1, 4, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];
        let bedRoomItems = [
            {
                "item": '∩',
                "row": 0,
                "col": 0
            },
            {
                "item": '∩',
                "row": 0,
                "col": 6
            },
            {
                "item": '∩',
                "row": 6,
                "col": 0
            },
            {
                "item": '∩',
                "row": 6,
                "col": 6
            }
        ];
        let bedRoomTitle = "Alcoves"; //Need a name
        let bedRoomDesc = "Nap pods installed by Al Co.";
        let bedRoom = new room(bedRoomTiles, [3, -1, 12, -1], bedRoomTitle, bedRoomDesc, bedRoomItems);
        roomList.push(bedRoom);

        let wennorTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let wennorItems = [
            {
                "item": 'i',
                "row": 0,
                "col": 0
            },
            {
                "item": 'i',
                "row": 0,
                "col": 6
            },
            {
                "item": '☺',
                "row": 1,
                "col": 1
            },
            {
                "item": '☺',
                "row": 1,
                "col": 3
            },
            {
                "item": '☺',
                "row": 1,
                "col": 5
            }, {
                "item": '╤',
                "row": 2,
                "col": 1
            },
            {
                "item": '╤',
                "row": 2,
                "col": 3
            },
            {
                "item": '╤',
                "row": 2,
                "col": 5
            },
            {
                "item": '☺',
                "row": 3,
                "col": 1
            },
            {
                "item": '☺',
                "row": 3,
                "col": 3
            },
            {
                "item": '☺',
                "row": 3,
                "col": 5
            }, {
                "item": '╤',
                "row": 4,
                "col": 1
            },
            {
                "item": '╤',
                "row": 4,
                "col": 3
            },
            {
                "item": '╤',
                "row": 4,
                "col": 5
            },
            {
                "item": 'W',
                "row": 6,
                "col": 3
            }
        ];
        let wennorTitle = "weNnoR's Auditorium";
        let wennorDesc = "Tsc fo daeh eht si weNnoR!";
        let wennorRoom = new room(wennorTiles, [4, -1, -1, -1], wennorTitle, wennorDesc, wennorItems);
        roomList.push(wennorRoom);

        let cornersTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 4, 4, 1, 4, 4, 1, 4],
            [4, 1, 4, 1, 1, 1, 4, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 5],
            [4, 1, 4, 1, 1, 1, 4, 1, 4],
            [4, 1, 4, 4, 1, 4, 4, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
        ];
        let cornersRoomItems = [
            {
                "item": 'i',
                "row": 2,
                "col": 2
            },
            {
                "item": 'i',
                "row": 2,
                "col": 4
            },
            {
                "item": 'i',
                "row": 4,
                "col": 2
            },
            {
                "item": 'i',
                "row": 4,
                "col": 4
            }
        ];
        let cornersRoomTitle = "Corner Room";
        let cornersRoomDesc = "It's like a room inside a room!";
        var cornersRoom = new room(cornersTiles, [5, 9, 14, -1], cornersRoomTitle, cornersRoomDesc, cornersRoomItems);
        roomList.push(cornersRoom);

        let lakeTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [5, 1, 1, 3, 3, 3, 3, 1, 5],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [4, 1, 1, 3, 3, 3, 3, 3, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];
        let lakeItems = [];
        let lakeTitle = "Lac du Lac";
        let lakeDesc = "Moisture is the essence of wetness.";
        let lakeRoom = new room(lakeTiles, [-1, 10, -1, 8], lakeTitle, lakeDesc, lakeItems);
        roomList.push(lakeRoom);

        let roundRoomTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 1, 1, 1, 0, 0, 4],
            [4, 0, 1, 1, 0, 1, 1, 0, 4],
            [5, 1, 1, 0, 0, 0, 1, 1, 4],
            [4, 0, 1, 1, 0, 1, 1, 0, 4],
            [4, 0, 0, 1, 1, 1, 0, 0, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];
        let roundItems = [
            {
                "item": 'F',
                "row": 3,
                "col": 6
            }
        ];
        let roundTitle = "E Pluribus Anus"; //Temp Name
        let roundDesc = "Don't fall off. Just kidding, we didn't want to program that.";
        let roundRoom = new room(roundRoomTiles, [-1, -1, -1, 9], roundTitle, roundDesc, roundItems);
        roomList.push(roundRoom);

        let commaRoomTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 0, 0, 0, 0, 0, 0, 1, 4],
            [4, 0, 0, 0, 1, 0, 0, 1, 4],
            [4, 1, 1, 0, 1, 0, 0, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 5],
            [4, 1, 1, 0, 1, 0, 0, 1, 4],
            [4, 0, 0, 0, 1, 0, 0, 1, 4],
            [4, 0, 0, 0, 0, 0, 0, 1, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let commaItems = [
            {
                "item": 'i',
                "row": 2,
                "col": 0
            },
            {
                "item": 'F',
                "row": 3,
                "col": 0
            },
            {
                "item": 'i',
                "row": 4,
                "col": 0
            }
        ];
        let commaTitle = "Tomb of O'xf-Ord";
        let commaDesc = "Is it \"Let's eat grandpa\" or is it \"Let's eat, grandpa\"?";
        let commaRoom = new room(commaRoomTiles, [-1, 12, -1, -1], commaTitle, commaDesc, commaItems);
        roomList.push(commaRoom);

        let skullTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 0, 0, 1, 0, 0, 1, 4],
            [4, 1, 0, 0, 1, 0, 0, 1, 4],
            [5, 1, 0, 0, 1, 0, 0, 1, 5],
            [4, 1, 1, 0, 1, 0, 1, 1, 4],
            [4, 0, 1, 1, 1, 1, 1, 0, 4],
            [4, 0, 1, 0, 1, 0, 1, 0, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let skullItems = [];
        let skullTitle = "Kingdom of the Crystal Skull"; //Temp name
        let skullDesc = "They really nuked the fridge with this room";
        let skullRoom = new room(skullTiles, [6, 13, -1, 11], skullTitle, skullDesc, skullItems);
        roomList.push(skullRoom);

        let bunnyEarTiles = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 1, 1, 1, 0, 1, 1, 1, 4],
            [4, 1, 0, 1, 0, 1, 0, 1, 4],
            [4, 1, 0, 1, 0, 1, 0, 1, 4],
            [5, 1, 0, 1, 0, 1, 0, 1, 5],
            [4, 1, 0, 1, 0, 1, 0, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 0, 1, 1, 1, 1, 1, 0, 4],
            [4, 4, 4, 4, 5, 4, 4, 4, 4]
        ];
        let bunnyItems = [];
        let bunnyTitle = "Hoppy Brewery"; //Temp name
        let bunnyDesc = "Hops, hops as far as the eye can see";
        let bunnyRoom = new room(bunnyEarTiles, [-1, 14, 15, 12], bunnyTitle, bunnyDesc, bunnyItems);
        roomList.push(bunnyRoom);

        let torchIslandTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 3, 3, 1, 1, 1, 3, 3, 4],
            [4, 3, 3, 1, 1, 1, 3, 3, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [5, 1, 1, 3, 3, 3, 1, 1, 4],
            [4, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 3, 3, 1, 1, 1, 3, 3, 4],
            [4, 3, 3, 1, 1, 1, 3, 3, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let torchIslandItems = [
            {
                "item": 'i',
                "row": 6,
                "col": 3
            }
        ];
        let torchIslandTitle = "Torch Island";
        let torchIslandDesc = "Did you know that water is wet?";
        let torchIslandRoom = new room(torchIslandTiles, [8, -1, -1, 13], torchIslandTitle, torchIslandDesc, torchIslandItems);
        roomList.push(torchIslandRoom);

        let snorkelTiles = [
            [4, 4, 4, 4, 5, 4, 4, 4, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 3, 3, 3, 3, 3, 1, 4],
            [4, 1, 3, 3, 3, 3, 3, 1, 4],
            [4, 1, 3, 3, 3, 3, 3, 1, 4],
            [4, 1, 3, 3, 3, 3, 3, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 0, 0, 1, 1, 1, 0, 0, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4]
        ];
        let snorkelItems = [
            {
                "item": 'J',
                "row": 6,
                "col": 3
            }
        ];
        let snorkelTitle = "Sanctuary of Snor'Kel";
        let snorkelDesc = "No relation to Kal-El. Snor'Kel is much cooler";
        let snorkelRoom = new room(snorkelTiles, [13, -1, -1, -1], snorkelTitle, snorkelDesc, snorkelItems);
        roomList.push(snorkelRoom);

        let freedomTiles = [
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7]
        ];
        let freedomItems = [];
        let freedomTitle = "Outside";
        let freedomDesc = "As the doors slowly churn open, sunlight hits your skin for the first time in two years.The light is stunning and overwhelms your eyes. Blinded, you stumble off into the unknown.";
        let freedomRoom = new room(freedomTiles, [-1, -1, -1, -1], freedomTitle, freedomDesc, freedomItems);
        roomList.push(freedomRoom);

        return roomList;
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
