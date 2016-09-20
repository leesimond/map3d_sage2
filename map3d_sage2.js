// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014
/**
 * Generates stacked bar graph with D3.js
 * @param appID - unique ID of SAGE2 app
 * @param appHeight - height of SAGE2 app
 * @param parent - reference to parent element by its ID to place graph
 * @param csvData - path to csv data
 * @param selectDataSet - data set selected for use in graph
 * @param selectLga - LGAs selected for use in graph
 * @param dataSetColours - array. List of hexadecimal colours
 * @param topLGA - Integer. Generate top LGA bar graph or not
 * @param maxYDomain - float. Max Y domain for multiple csv stacked bar graphs
 */
function stacked_bar_graph(appID, appHeight, parent, csvData, selectDataSet, selectLga, dataSetColours, topLGA, maxYDomain) {
    var parentWidth = parent.clientWidth, parentHeight = parent.clientHeight;
    var margin = {top: appHeight / 75, right: appHeight/ 20, bottom: appHeight / 5, left: appHeight / 7},
        width = parentWidth - margin.left - margin.right,//380,//2000 - margin.left - margin.right,
        height = parentHeight - margin.top - margin.bottom;//250;//750 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
        .rangeRound([height, 5]);

    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));

    var svg = d3.select(parent).append("svg")
      .attr("id", "stackedBarChart" + appID)
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv(csvData, function(error, data) {
        if (error) throw error;
        color.domain(d3.keys(data[0]).filter(function(key) { return selectDataSet.indexOf(key) !== -1;}));

        data.forEach(function(d) {
            var y0 = 0;
            d.value = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
            d.total = d.value[d.value.length - 1].y1;
        });

        data.sort(function(a, b) { return b.total - a.total; });

        // Filter data based on LGAs selected
        var lgaFilter = function(arr, selectArr) {
            var newArr = [];
            for (var i = 0; i < selectArr.length; i++) {
                for (var j = 0; j < arr.length; j++) {
                    if (arr[j].LGA_name === selectArr[i].name) {
                        newArr.push(arr[j]);
                        break;
                    }
                }
            }
            return newArr;
        };

        // Filter data by top value e.g top ten
        if (topLGA) {
            data = data.slice(0, topLGA);
            selectLga = [];
            for (var i = 0; i < data.length; i++) {
                selectLga.push({
                    name: data[i].LGA_name,
                    total: data[i].total
                });
            }
        } else {
            data = lgaFilter(data, selectLga);
        }

        // Have bars displayed in same order as data set/mesh added
        var tempArray, barHeight;
        for (var i = 0; i < data.length; i++) {
            tempArray = data[i].value.slice();
            barHeight = 0;
            for (var j = 0; j < selectDataSet.length; j++) {
                for (var k = 0; k < tempArray.length; k++) {
                    if (tempArray[k].name === selectDataSet[j]) {
                        data[i].value[j] = tempArray[k];
                        data[i].value[j].y0 = barHeight;
                        barHeight += Number(data[i][selectDataSet[j]]);
                        data[i].value[j].y1 = barHeight;
                        break;
                    }
                }
            }
        }

        x.domain(data.map(function(d) { return d.LGA_name; }));
        //y.domain([0, d3.max(data, function(d) { return d.total; })]);
        var yDomain = Math.max(maxYDomain, d3.max(data, function(d) { return d.total; }));
        if (yDomain > maxYDomain)
            maxYDomain = yDomain;
        y.domain([0, yDomain]);


        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", appHeight / - 100)
            .attr("y", appHeight / 200)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .style("font-size", appHeight / 20 + "px")
            .text("Amount");

        var count = -1;
        var LGA = svg.selectAll(".LGA")
            .data(data)
            .enter().append("g")
            .attr("class", "g")
            .attr("id", function() { count += 1; return "graphRectangle" + count + appID; })
            .attr("transform", function(d) { return "translate(" + x(d.LGA_name) + ",0)"; })

        LGA.selectAll("rect")
            .data(function(d) { return d.value; })
            .enter().append("rect")
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.y1); })
            .attr("height", function(d) { return y(d.y0) - y(d.y1); })
            .attr("x", appHeight / 30)
            .style("fill", function(d) { return dataSetColours[d.name] });
        //.style("opacity", "1");
        //.style("fill", function(d) { return color(d.name); });

        var legend = svg.selectAll(".legend")
            //.data(color.domain().slice().reverse())
            .data(selectDataSet.slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * appHeight / 25 + ")"; });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("y", 0)
            .attr("width", appHeight / 30)
            .attr("height", appHeight / 30)
            .style("fill", function(d) { return dataSetColours[d] });
        //.style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 0)
            .attr("dy", ".75em")
            .style("text-anchor", "end")
            .style("font-size", appHeight / 30 + "px")
            .text(function(d) { return d; });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "start")
            .style("font-size", appHeight / 20 + "px")
            .attr("x", appHeight / 30)
            .attr("y", appHeight / 80)
            .attr("transform", "rotate(-90)");
    });
}
/**
 * Get max Y domain for multiple csv stacked bar graphs
 * @param index - integer. Index for selectCsvLength
 * @param selectCsvLength - integer. Length of selectCsv array
 * @param resrcPath - string. Path to app root folder
 * @param selectCsv - array. Selected csv files
 * @param selectDataSet - array. Data set selected
 * @param maxYDomain - float. Keep track of largest Y domain for stacked bar graph
 * @param callback - function. Function to call after max Y domain calculated
 */
function getMaxYDomain(index, selectCsvLength, resrcPath, selectCsv, selectDataSet, maxYDomain, callback) {
    var color = d3.scale.ordinal();
    d3.csv(resrcPath + selectCsv[index], function(error, data) {
        if (error) throw error;
        color.domain(d3.keys(data[0]).filter(function(key) { return selectDataSet.indexOf(key) !== -1;}));

        data.forEach(function(d) {
            var y0 = 0;
            d.value = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
            d.total = d.value[d.value.length - 1].y1;
        });

        data.sort(function (a, b) {
            return b.total - a.total;
        });

        var yDomain = Math.max(maxYDomain, data[0].total);
        if (yDomain > maxYDomain)
            maxYDomain = yDomain;
        index++;
        if (index < selectCsvLength) {
            getMaxYDomain(index, selectCsvLength, resrcPath, selectCsv, selectDataSet, maxYDomain, callback);
        } else {
            console.log("calling");
            callback(maxYDomain);
        }
    });
}

/**
 * getMaxYDomain driver
 * @param selectDataSet - array. Data set selected
 * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
 * @param resrcPath - string. Path to app root folder
 * @param selectCsv - array. Selected csv files
 * @param callback - function. Function to call after max Y domain calculated
 */
function getMaxYDomain_aux(selectDataSet, dataCsvStore, resrcPath, selectCsv, callback) {
    if (selectDataSet.length > 0) {
        for (var csv in dataCsvStore) {
            if (dataCsvStore.hasOwnProperty(csv)) {
                dataCsvStore[csv]["bar_graph"] = null;
            }
        }
        getMaxYDomain(0, selectCsv.length, resrcPath + "data/", selectCsv, selectDataSet, 0, callback);
    } else {
        callback();
    }
}
/**
 * Changes information box and highlights LGA bar based on mouse over
 * @param app - SAGE2 app
 * @param clientWidthLeft - integer; left width starting position of div containing bar graph
 * @param clientWidthRight - integer; right width ending position of div containing bar graph
 * @param positionX - integer; sage2 mouse X position
 * @param selectLga - array; objects of lga containing properties name and total
 * @param locked - Boolean; whether an LGA is locked in the information box
 * @param appId - string; unique Id of app session
 * @param currentGraphItemSelection - integer. Id of current graph rectangle highlighted
 */
function graph_mouse_over(app, clientWidthLeft, clientWidthRight, positionX, selectLga, locked, appId, currentGraphItemSelection) {
    var dataSelector = app.initialDataSelector;
    if (!app.initialDataSelector) {
        dataSelector = app.dataSelector1;
    }
    clientWidthLeft *= 1.11;
    clientWidthRight *= 0.99;

    if (!locked && selectLga.length > 0) {
        var graphRectangle;
        // Mouse over graph
        if (positionX > clientWidthLeft && positionX < clientWidthRight) {
            var barArea = clientWidthRight - clientWidthLeft;
            positionX -= clientWidthLeft;
            app.graphItemSelection = Math.floor(positionX / barArea * selectLga.length);
            // If graph bar highlighted is not correct
            if (currentGraphItemSelection !== app.graphItemSelection) {
                // Make all bars with 1 opacity
                for (var i = 0; i < selectLga.length; i++) {
                    if (i !== app.graphItemSelection) {
                        graphRectangle = document.getElementById("graphRectangle" + i + appId);
                        if (graphRectangle)
                            graphRectangle.style.opacity = 1;
                        dataSelector.updateDataMouseover(selectLga[i].id, true);
                    }
                }
                // Make mouse over bar 0.5 opacity and update information box accordingly
                app.graphHighlightedLga = selectLga[app.graphItemSelection];
                document.getElementById("lga-name" + appId).innerHTML = app.graphHighlightedLga.name + ": Total = " + app.graphHighlightedLga.total;
                graphRectangle = document.getElementById("graphRectangle" + app.graphItemSelection + appId);
                if (graphRectangle)
                    graphRectangle.style.opacity = 0.5;
                dataSelector.updateDataMouseover(app.graphHighlightedLga.id);
            }
        } else {
            // Unselect map and graph highlight
            if (app.graphHighlightedLga) {
                document.getElementById("lga-name" + appId).innerHTML = "Move mouse over map";
                graphRectangle = document.getElementById("graphRectangle" + app.graphItemSelection + appId);
                if (graphRectangle)
                    graphRectangle.style.opacity = 1;
                dataSelector.updateDataMouseover(app.graphHighlightedLga.id, true);
                app.graphItemSelection = false;
                app.graphHighlightedLga = false;
            }
        }
    }
}

/**
 * SAGE2 mouse menu movement selection with highlighting
 * @param clientWidthLeft - starting left horizontal position of menu
 * @param clientWidthRight - starting right horizontal position of menu
 * @param clientHeight - height of SAGE2 app
 * @param mouseX - software mouse position of SAGE2
 * @param mouseY - software mouse position of SAGE2
 * @param menuSelected - items in menu selected
 * @param noItems - total number of items available in menu
 * @param menuDataUnselected - menu text data unselected colour
 * @param menuDataSelected - menu text data selected colour
 * @param menuDataSelectedHover - menu text data selected hover colour
 * @param menuDataHover - menu text data hover colour
 * @param mouseDisabled - boolean. Whether software mouse is disabled
 */
function menu_selection(clientWidthLeft, clientWidthRight, clientHeight, mouseX, mouseY, menuSelected, noItems, menuDataUnselected, menuDataSelected, menuDataSelectedHover, menuDataHover, mouseDisabled) {
    if (!mouseDisabled) {
        var item;
        if (mouseX > clientWidthLeft && mouseX < clientWidthRight) {
            var item_selection = Math.ceil(mouseY / clientHeight * noItems);
            for (item in menuSelected) {
                if (menuSelected[item][0] == item_selection && menuSelected[item][1] === false) {
                    menuSelected[item][1] = true;
                    if (menuSelected[item][2] === menuDataUnselected) {
                        menuSelected[item][2] = menuDataHover;
                    } else if (menuSelected[item][2] === menuDataSelected) {
                        menuSelected[item][2] = menuDataSelectedHover;
                    }
                    document.getElementById(item).style.color = menuSelected[item][2];
                } else if (menuSelected[item][0] != item_selection && menuSelected[item][1] === true) {
                    menuSelected[item][1] = false;
                    if (menuSelected[item][2] === menuDataSelectedHover) {
                        document.getElementById(item).style.color = menuDataSelected;
                    } else if (menuSelected[item][2] === menuDataHover) {
                        document.getElementById(item).style.color = menuDataUnselected;
                    }
                }
            }
        } else {
            for (item in menuSelected) {
                if (document.getElementById(item).style.color == menuDataHover) {
                    menuSelected[item][1] = false;
                    document.getElementById(item).style.color = menuDataUnselected;
                }
            }
        }
    }
}

/**
 * Select menu item and add data variable to selected data set
 * @param currentItem - string. Name of menu item
 * @param menuSelected - Object. Track what menu items are selected
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectDataSet - data set selected
 * @param selectColour - string. colour to change menu item
 */
var push_menu_item_data = function(currentItem, menuSelected, app, divSelect, selectDataSet, selectColour) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            push_menu_item_data(currentItem, menuSelected, app, divSelect, selectDataSet, selectColour);
        }, app.haltTime);
    } else {
        app.timerOn = false;
        app.tick = 0.0;
        // reload initial csv
        var reloadedInitialCsv = false;
        if (app.currentCsv != app.initialCsv) {
            UpdateMapToCsvNoAnimation(app, app.initialCsv, app.dataCsvStore);
            reloadedInitialCsv = true;
        } else {
            app.initialMeshPosition = {};
            app.initialColours = {};
        }
        var itemString = currentItem + app.element.id;
        menuSelected[itemString][1] = true;
        menuSelected[itemString][2] = selectColour;
        document.getElementById(itemString).style.color = menuSelected[itemString][2];
        if (selectDataSet.indexOf(currentItem) === -1) {
            selectDataSet.push(currentItem);
        }
        var selectCsv = app.selectCsv;
        var addSelectedData = function (app, selectCsv, currentItem, selectDataSet) {
            var appDataSelector = app.dataCsvStore[selectCsv]["dataSelector"];
            var selectLga = appDataSelector.addDataToAll(currentItem, selectDataSet, app.dataSetColours[currentItem], app.extrudeHeight, app.originalExtrudeHeight, app.noLGAs);
            appDataSelector.updateDataColourSelected(selectDataSet, selectLga);
        };
        for (var i = 0; i < selectCsv.length; i++) {
            addSelectedData(app, selectCsv[i], currentItem, selectDataSet);
        }
        if (selectCsv.indexOf(app.initialCsv) == -1) {
            addSelectedData(app, app.initialCsv, currentItem, selectDataSet);
        }
        getMaxYDomain_aux(selectDataSet, app.dataCsvStore, app.resrcPath, selectCsv, function (result) {
            app.maxYDomain = result;
            console.log('maxYdomain', app.maxYDomain);
            app.csvPath = app.resrcPath + "data/" + app.currentCsv;
            updateGraphAllCsvs(app, app.csvPath, app.noLGAs, app.currentCsv);
            app.currentIndex = getNextIndex(app.selectCsv, app.currentCsv);
            if (reloadedInitialCsv) UpdateMapToCsvNoAnimation(app, app.currentCsv, app.dataCsvStore);
            app.selectLga = app.dataCsvStore[app.currentCsv]["dataSelector"].getTopNumberLga(app.noLGAs);
            app.timerOn = !app.paused;
            app.threeRender1.renderOnce();
        });
    }
};

/**
 * Deselect menu item and remove data variable from selected data set
 * @param currentItem - string. Name of menu item
 * @param menuSelected - Object. Track what menu items are selected
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectDataSet - data set selected
 * @param selectColour - string. colour to change menu item
 */
var remove_menu_item_data = function(currentItem, menuSelected, app, divSelect, selectDataSet, selectColour) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            remove_menu_item_data(currentItem, menuSelected, app, divSelect, selectDataSet, selectColour);
        }, app.haltTime);
    } else {
        app.timerOn = false;
        app.tick = 0.0;
        // reload initial csv
        var reloadedInitialCsv = false;
        if (app.currentCsv != app.initialCsv) {
            UpdateMapToCsvNoAnimation(app, app.initialCsv, app.dataCsvStore);
            reloadedInitialCsv = true;
        } else {
            app.initialMeshPosition = {};
            app.initialColours = {};
        }
        var itemString = currentItem + app.element.id;
        menuSelected[itemString][1] = false;
        menuSelected[itemString][2] = selectColour;
        document.getElementById(itemString).style.color = menuSelected[itemString][2];
        selectDataSet.splice(selectDataSet.indexOf(currentItem), 1);

        var selectCsv = app.selectCsv;
        var removeSelectedData = function (app, selectCsv, currentItem, selectDataSet) {
            var appDataSelector = app.dataCsvStore[selectCsv]["dataSelector"];
            var selectLga = appDataSelector.removeDataVariable(currentItem, selectDataSet, app.noLGAs);
            appDataSelector.updateDataColourSelected(selectDataSet, selectLga);
        };
        for (var i = 0; i < selectCsv.length; i++) {
            removeSelectedData(app, selectCsv[i], currentItem, selectDataSet);
        }
        if (selectCsv.indexOf(app.initialCsv) == -1) {
            removeSelectedData(app, app.initialCsv, currentItem, selectDataSet);
        }
        getMaxYDomain_aux(selectDataSet, app.dataCsvStore, app.resrcPath, selectCsv, function (result) {
            app.maxYDomain = result;
            console.log('maxYdomain', app.maxYDomain);
            app.csvPath = app.resrcPath + "data/" + app.currentCsv;
            updateGraphAllCsvs(app, app.csvPath, app.noLGAs, app.currentCsv);
            app.currentIndex = getNextIndex(app.selectCsv, app.currentCsv);
            if (reloadedInitialCsv) {
                app.initialMeshPosition = {};
                app.initialColours = {};
                UpdateMapToCsvNoAnimation(app, app.currentCsv, app.dataCsvStore);
            }
            app.selectLga = app.dataCsvStore[app.currentCsv]["dataSelector"].getTopNumberLga(app.noLGAs);
            app.timerOn = !app.paused;
            app.threeRender1.renderOnce();
        });
    }
};

/**
 * Perform action on child menu items
 * @param groupedData - object. Contains menu items with parents
 * @param menuSelected - Object. Track what menu items are selected
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectDataSet - data set selected
 * @param selectColour - string. colour to change menu item
 * @param removeItem - boolean. Whether a menu item is to be deselected
 */
var select_menu_item_child = function(groupedData, menuSelected, app, divSelect, selectDataSet, selectColour, removeItem) {
    for (var name in groupedData) {
        if (groupedData.hasOwnProperty(name)) {
            var itemString = name.concat(app.element.id);
            // Menu item is moused over but not selected
            menuSelected[itemString][2] = selectColour;
            document.getElementById(itemString).style.color = menuSelected[itemString][2];
            // Check if property's child is a parent itself
            if (!Array.isArray(groupedData[name])) {
                select_menu_item_child(groupedData[name], menuSelected, app, divSelect, selectDataSet, selectColour, removeItem);
            } else {
                for (var i = 0; i < groupedData[name].length; i++) {
                    if (!removeItem) {
                        push_menu_item_data(groupedData[name][i], menuSelected, app, divSelect, selectDataSet, selectColour);
                    } else {
                        remove_menu_item_data(groupedData[name][i], menuSelected, app, divSelect, selectDataSet, selectColour);
                    }
                }
            }
        }
    }
};

/**
 * Perform action for selected menu item
 * @param groupedData - object. Contains menu items with parents
 * @param menuSelected - Object. Track what menu items are selected
 * @param menuItem - string. Name of menu item
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectDataSet - data set selected
 * @param selectColour - string. colour to change menu item
 * @param removeItem - boolean. Whether a menu item is to be deselected
 */
var select_menu_item = function (groupedData, menuSelected, menuItem, app, divSelect, selectDataSet, selectColour, removeItem) {
    var itemString = menuItem.substring(0, menuItem.indexOf("app"));
    // If single menu item is selected
    if (Array.isArray(groupedData)) {
        for (var i = 0; i < groupedData.length; i++) {
            if (groupedData[i] == itemString) {
                menuSelected[menuItem][2] = selectColour;
                document.getElementById(menuItem).style.color = menuSelected[menuItem][2];
                if (!removeItem) {
                    push_menu_item_data(groupedData[i], menuSelected, app, divSelect, selectDataSet, selectColour);
                } else {
                    remove_menu_item_data(groupedData[i], menuSelected, app, divSelect, selectDataSet, selectColour);
                }
            }
        }
    } else {
        for (var name in groupedData) {
            if (groupedData.hasOwnProperty(name)) {
                if (name == itemString) {
                    // Menu item is moused over but not selected
                    menuSelected[menuItem][2] = selectColour;
                    document.getElementById(menuItem).style.color = menuSelected[menuItem][2];
                    // Check if property's child is a parent itself
                    if (!Array.isArray(groupedData[name])) {
                        select_menu_item_child(groupedData[name], menuSelected, app, divSelect, selectDataSet, selectColour, removeItem);
                    } else {
                        for (var i = 0; i < groupedData[name].length; i++) {
                            if (!removeItem) {
                                push_menu_item_data(groupedData[name][i], menuSelected, app, divSelect, selectDataSet, selectColour);
                            } else {
                                remove_menu_item_data(groupedData[name][i], menuSelected, app, divSelect, selectDataSet, selectColour);
                            }
                        }
                    }
                } else {
                    select_menu_item(groupedData[name], menuSelected, menuItem, app, divSelect, selectDataSet, selectColour, removeItem);
                }
            }
        }
    }
};

/**
 * Perform action when selecting menu item
 * @param app - SAGE2 app
 * @param menuSelected - Object. Track what menu items are selected
 * @param groupedData - object. Contains menu items with parents
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectDataSet - data set selected
 * @param menuDataUnselected - menu text data unselected colour
 * @param menuDataSelected - menu text data selected colour
 * @param menuDataHover - menu text data hover colour
 */
function menu_click(app, menuSelected, groupedData, divSelect, selectDataSet, menuDataUnselected, menuDataSelected, menuDataHover) {
    app.mouseSelectionDisabled = true;
    var item;
    for (item in menuSelected) {
        if (menuSelected.hasOwnProperty(item)) {
            // If menu item is moused over
            if (menuSelected[item][1] === true) {
                // Remove unique menu item app tag
                // If menu item is moused over but not selected
                if (menuSelected[item][2] === menuDataHover) {
                    select_menu_item(groupedData, menuSelected, item, app, divSelect, selectDataSet, menuDataSelected, false);
                    app.mouseSelectionDisabled = false;
                    return;
                } else {
                    // Unselect menu item
                    select_menu_item(groupedData, menuSelected, item, app, divSelect, selectDataSet, menuDataUnselected, true);
                    app.mouseSelectionDisabled = false;
                    return;
                }
            }
        }
    }
}

/**
 * Update map data and face colour
 * @param app - SAGE2 app
 */
var updateMap = function(app) {
    var noLGAs = app.noLGAs;
    // Revert LGAs face mesh to original colour
    var selectCsv = app.selectCsv;
    console.log(app.dataCsvStore, selectCsv);
    for (var i = 0; i < selectCsv.length; i++) {
        console.log(app.dataCsvStore[selectCsv[i]], selectCsv[i], app.dataCsvStore);
        var appDataSelector = app.dataCsvStore[selectCsv[i]]["dataSelector"];
        var lgaView = app.mapLoader1.getLGAviews();
        var lgaId, currentLga;
        // Revert LGAs face mesh to original colour
        for (var id in lgaView) {
            if (lgaView.hasOwnProperty(id)) {
                lgaId = lgaView[id].getLGA().getLGAid();
                currentLga = {id: lgaId};
                appDataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLga, true);
            }
        }
        app.selectLga = appDataSelector.getTopNumberLga(noLGAs);
        for (var j = 0; j < app.selectDataSet.length; j++) {
            appDataSelector.addDataToAll(app.selectDataSet[j], app.selectDataSet, app.dataSetColours[app.selectDataSet[j]], app.extrudeHeight, app.originalExtrudeHeight);
        }
        appDataSelector.updateDataColourSelected(app.selectDataSet, app.selectLga);
    }
    app.threeRender1.renderOnce();
};

/**
 * Create Tween animation for map scaling
 * @param mesh - Object. Mesh to animate
 * @param initial - Object. Initial mesh values
 * @param target - Object. Target mesh values
 */
function createTweenMapScale(mesh, initial, target) {
    var tween = new TWEEN.Tween(initial).to(target, 1000);

    tween.onUpdate(function(){
        mesh.scale.z = initial.scale;
        mesh.position.z = initial.position;
    });
    tween.start();
}

/**
 * Create Tween animation for csv change
 * @param mesh - Object. Mesh to animate
 * @param initial - Object. Initial mesh values
 * @param target - Object. Target mesh values
 */
function createTweenCSVChange(mesh, initial, target) {
    var tween = new TWEEN.Tween(initial).to(target, 1000);

    tween.onUpdate(function(){
        mesh.position.z = initial.position;
        mesh.scale.z = initial.scale;
        mesh.material.materials[0].color.r = initial.color0Red;
        mesh.material.materials[0].color.g = initial.color0Green;
        mesh.material.materials[0].color.b = initial.color0Blue;
        mesh.material.materials[2].color.r = initial.color2Red;
        mesh.material.materials[2].color.g = initial.color2Green;
        mesh.material.materials[2].color.b = initial.color2Blue;
    });
    tween.start();
}

/**
 * Scale map meshes
 * @param app - SAGE2 app
 * @param up - boolean. Whether map is scaling up
 */
var scaleMap = function(app, up) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            scaleMap(app, up);
        }, app.haltTime);
    } else {
        app.timerOn = false;
        app.tick = 0.0;
        var scale = 2;
        if (up) {
            app.extrudeHeight *= scale;
        } else {
            app.extrudeHeight /= scale;
        }
        var lgaView;
        var lga, selectDataLGA;
        var selectData = app.selectDataSet;
        var mesh;
        var initial, target;
        var selectCsv = app.selectCsv;
        for (var j = 0; j < selectCsv.length; j++) {
            lgaView = app.dataCsvStore[selectCsv[j]]["mapLoader"].getLGAviews();
            for (var id in lgaView) {
                if (lgaView.hasOwnProperty(id)) {
                    for (var i = 0; i < selectData.length; i++) {
                        mesh = lgaView[id].getDataMeshes()[selectData[i]];
                        var emptyInitialMeshPosition = Object.keys(app.initialMeshPosition).length == 0;
                        var mapLoader = app.dataCsvStore[selectCsv[j]]["mapLoader"];
                        if (up) {
                            initial = {position: mesh.position.z, scale: mesh.scale.z};
                            target = {position: mesh.position.z * scale, scale: mesh.scale.z * scale};
                            if (!emptyInitialMeshPosition && app.initialMapLoader == mapLoader) {
                                lga = lgaView[id].getLGA().getName();
                                selectDataLGA = selectData[i] + lga;
                                app.initialMeshPosition[selectDataLGA] *= scale;
                            }
                            createTweenMapScale(mesh, initial, target);
                        } else {
                            initial = {position: mesh.position.z, scale: mesh.scale.z};
                            target = {position: mesh.position.z / scale, scale: mesh.scale.z / scale};
                            if (!emptyInitialMeshPosition && app.initialMapLoader == mapLoader) {
                                lga = lgaView[id].getLGA().getName();
                                selectDataLGA = selectData[i] + lga;
                                app.initialMeshPosition[selectDataLGA] /= scale;
                            }
                            createTweenMapScale(mesh, initial, target);
                        }
                    }
                }
            }
        }
        app.timerOn = true;
    }
};

/**
 * Reset no. LGAs for all csvs
 * @param csvNoLGAs - object. Stores no LGAs to display for each csv
 * @param noLGAs - integer. No. of LGAs to display
 */
function resetCsvNoLGAs(csvNoLGAs, noLGAs) {
    for (csv in csvNoLGAs) {
        if (csvNoLGAs.hasOwnProperty(csv)) {
            csvNoLGAs[csv] = noLGAs;
        }
    }
}
/**
 * Update map and graph for all selected csv files showing top number of LGAs. E.g Top ten LGAs
 * @param app - SAGE2 app
 * @param dataSelector - class. Select which data to display.
 * @param mapLoader - class. Stores LGAviews, and links them with Lga objects in the dataLoader
 * @param noLGAs - integer. No of top LGAs to display
 */
function updateMapAndGraphTopNo(app, dataSelector, mapLoader, noLGAs) {
    app.noLGAs = noLGAs;
    resetCsvNoLGAs(app.csvNoLGAs, noLGAs);
    app.initialColours = {};
    var lgaView = mapLoader.getLGAviews();
    var csvFileNames = app.csvFileNames;
    var selectCsv = app.selectCsv;
    var lgaId, currentLga;
    for (var i = 0; i < csvFileNames.length; i++) {
        var appDataSelector = app.dataCsvStore[csvFileNames[i]]["dataSelector"];
            // Revert LGAs face mesh to original colour
            for (var id in lgaView) {
                if (lgaView.hasOwnProperty(id)) {
                    lgaId = lgaView[id].getLGA().getLGAid();
                    currentLga = {id: lgaId};
                    appDataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLga, true);
                }
            }
            app.selectLga = appDataSelector.getTopNumberLga(noLGAs);
            //console.log("selectlga", app.selectLga);
            appDataSelector.updateDataColourSelected(app.selectDataSet, app.selectLga);
    }
    updateGraphAllCsvs(app, app.csvPath, app.noLGAs, app.currentCsv);
    app.currentIndex = getNextIndex(app.selectCsv, app.currentCsv);
    UpdateMapToCsvNoAnimation(app, app.currentCsv, app.dataCsvStore);
    app.threeRender1.renderOnce();
}

/**
 * Update map and graph for csv file
 * @param app - SAGE2 app
 * @param csvPath - string. Path to csv file
 * @param noLGAs - integer. No of top LGAs to display
 * @param currentCsvDataStore - object. Has map and data classes for single csv
 */
function updateMapAndGraph(app, csvPath, noLGAs, currentCsvDataStore) {
    var lgaView = app.mapLoader1.getLGAviews();
    var lgaId, currentLga;
    // Revert LGAs face mesh to original colour
    for (var id in lgaView) {
        if (lgaView.hasOwnProperty(id)) {
            lgaId = lgaView[id].getLGA().getLGAid();
            currentLga = {id: lgaId};
            app.dataSelector1.updateSingleDataColourSelected(app.selectDataSet, currentLga, true);
        }
    }
    app.selectLga = app.dataSelector1.getTopNumberLga(noLGAs);
    app.dataSelector1.updateDataColourSelected(app.selectDataSet, app.selectLga);
    // Update graph and render updated map
    if (document.getElementById("stackedBarChart" + app.element.id)) {
        document.getElementById("main_container" + app.element.id).removeChild(document.getElementById("stackedBarChart" + app.element.id));
    }
    if (currentCsvDataStore["bar_graph"]) {
        document.getElementById("main_container" + app.element.id).appendChild(currentCsvDataStore["bar_graph"]);
    } else {
        stacked_bar_graph(app.element.id, app.element.clientHeight, document.getElementById("main_container" + app.element.id), csvPath, app.selectDataSet, app.selectLga, app.dataSetColours, noLGAs, app.maxYDomain);
        currentCsvDataStore["bar_graph"] = document.getElementById("stackedBarChart" + app.element.id);
    }
}
/**
 * Update graph for current csv and make remove other csv graphs
 * @param app - SAGE2 app
 * @param csvPath - string. Path to csv file
 * @param noLGAs - integer. No of top LGAs to display
 * @param currentCsvDataStore - object. Has map and data classes for single csv
 */
function updateGraphAllCsvs(app, csvPath, noLGAs, currentCsvDataStore) {
    if (document.getElementById("stackedBarChart" + app.element.id)) {
        document.getElementById("main_container" + app.element.id).removeChild(document.getElementById("stackedBarChart" + app.element.id));
    }
    if (app.selectDataSet.length > 0)
        stacked_bar_graph(app.element.id, app.element.clientHeight, document.getElementById("main_container" + app.element.id), csvPath, app.selectDataSet, app.selectLga, app.dataSetColours, noLGAs, app.maxYDomain);
    var csvFileNames = app.csvFileNames;
    for (var i = 0; i < csvFileNames.length; i++) {
        app.dataCsvStore[csvFileNames[i]]["bar_graph"] = null;
    }
    app.dataCsvStore[currentCsvDataStore]["bar_graph"] = document.getElementById("stackedBarChart" + app.element.id);
}
/**
 * Deselect any LGAs highlighted
 * @param app - SAGE2 app
 */
function deselectLgasHighlighted(app) {
    var currentLgaSelected = app.lgasId[app.currentLgaSelected];
    if (currentLgaSelected != "NA") {
        app.dataSelector1.updateMapMouseover(currentLgaSelected, true);
        app.lgasHighlighted[app.currentLgaSelected] = false;
    }
}
/**
 * Load app data into initial holder if not done yet
 * @param app - SAGE2 app
 */
function loadInitialData(app) {
    if (app.initialThreeRender == null) {
        app.initialThreeRender = app.threeRender1;
    }
    if (app.initialMapLoader == null) {
        app.initialMapLoader = app.mapLoader1;
    }
    if (app.initialDataSelector == null) {
        app.initialDataSelector = app.dataSelector1;
    }
}
/**
 * Load mesh colours and values into initial holder if not done yet
 * @param app - SAGE2 app
 * @param selectDataLGA - LGAs selected for use in graph
 * @param meshCurrent - LGA mesh
 */
function loadInitialMeshColoursValues(app, selectDataLGA, meshCurrent) {
    if (app.initialMeshPosition[selectDataLGA] == null) {
        app.initialMeshPosition[selectDataLGA] = meshCurrent.position.z;
    }

    if (app.initialColours[selectDataLGA] == null) {
        app.initialColours[selectDataLGA] = {};
        app.initialColours[selectDataLGA][0] = {};
        app.initialColours[selectDataLGA][2] = {};
        app.initialColours[selectDataLGA][0]['red'] = meshCurrent.material.materials[0].color.r;
        app.initialColours[selectDataLGA][0]['green'] = meshCurrent.material.materials[0].color.g;
        app.initialColours[selectDataLGA][0]['blue'] = meshCurrent.material.materials[0].color.b;
        app.initialColours[selectDataLGA][2]['red'] = meshCurrent.material.materials[2].color.r;
        app.initialColours[selectDataLGA][2]['green'] = meshCurrent.material.materials[2].color.g;
        app.initialColours[selectDataLGA][2]['blue'] = meshCurrent.material.materials[2].color.b;
    }

    if (app.initialValues[selectDataLGA] == null) {
        app.initialValues[selectDataLGA] = meshCurrent.name;
    }
}

/**
 * Update map to csv with no animation
 * @param app - SAGE2 app
 * @param dataCsv - string. Csv to display
 * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
 */
function UpdateMapToCsvNoAnimation(app, dataCsv, dataCsvStore) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            UpdateMapToCsvNoAnimation(app, dataCsv, dataCsvStore);
        }, app.haltTime);
    } else {
        deselectLgasHighlighted(app);
        loadInitialData(app);
        var previousDataLoader = app.dataLoader1;
        app.data1 = dataCsvStore[dataCsv]["data"];
        app.dataLoader1 = dataCsvStore[dataCsv]["dataLoader"];
        app.mapLoader1 = dataCsvStore[dataCsv]["mapLoader"];
        app.dataSelector1 = dataCsvStore[dataCsv]["dataSelector"];

        var currentDataLoader = app.dataLoader1;
        var scale;
        var lgaView = app.initialMapLoader.getLGAviews();
        var lgaView2 = dataCsvStore[dataCsv]["mapLoader"].getLGAviews();
        var selectData = app.selectDataSet;
        var meshCurrent, meshTarget;
        for (var id in lgaView) {
            if (lgaView.hasOwnProperty(id)) {
                for (var i = 0; i < selectData.length; i++) {
                    meshCurrent = lgaView[id].getDataMeshes()[selectData[i]];
                    meshTarget = lgaView2[id].getDataMeshes()[selectData[i]];
                    var meshCurrentData = previousDataLoader.getLGAsObject()[id].getDataPoint(selectData[i]).getDataValue();
                    var meshTargetData = currentDataLoader.getLGAsObject()[id].getDataPoint(selectData[i]).getDataValue();
                    if (!isFinite(meshCurrentData) || meshCurrentData == 0) meshCurrentData = 0.1; // Can't scale to 0
                    if (!isFinite(meshTargetData) || meshTargetData == 0) meshTargetData = 0.1;
                    scale = meshTargetData / meshCurrentData;
                    var lga = lgaView[id].getLGA().getName();
                    var selectDataLGA = selectData[i] + lga;
                    var previousMeshName = meshCurrent.name;
                    var currentLga = document.getElementById("lga-name" + app.element.id).innerHTML;

                    loadInitialMeshColoursValues(app, selectDataLGA, meshCurrent);

                    meshCurrent.name = meshTarget.name;
                    meshCurrent.position.z = meshTarget.position.z;
                    meshCurrent.scale.z = meshCurrent.scale.z * scale;

                    meshCurrent.material.materials[0].color.r = meshTarget.material.materials[0].color.r;
                    meshCurrent.material.materials[0].color.g = meshTarget.material.materials[0].color.g;
                    meshCurrent.material.materials[0].color.b = meshTarget.material.materials[0].color.b;
                    meshCurrent.material.materials[2].color.r = meshTarget.material.materials[2].color.r;
                    meshCurrent.material.materials[2].color.g = meshTarget.material.materials[2].color.g;
                    meshCurrent.material.materials[2].color.b = meshTarget.material.materials[2].color.b;

                    // If next mesh target is same as initial csv mesh
                    if (meshCurrent.uuid == meshTarget.uuid) {
                        meshCurrent.position.z = app.initialMeshPosition[selectDataLGA];
                        meshCurrent.material.materials[0].color.r = app.initialColours[selectDataLGA][0]['red'];
                        meshCurrent.material.materials[0].color.g = app.initialColours[selectDataLGA][0]['green'];
                        meshCurrent.material.materials[0].color.b = app.initialColours[selectDataLGA][0]['blue'];
                        meshCurrent.material.materials[2].color.r = app.initialColours[selectDataLGA][2]['red'];
                        meshCurrent.material.materials[2].color.g = app.initialColours[selectDataLGA][2]['green'];
                        meshCurrent.material.materials[2].color.b = app.initialColours[selectDataLGA][2]['blue'];
                        meshCurrent.name = app.initialValues[selectDataLGA];
                    }
                    // Update map info without mouse hover refresh
                    if (currentLga == previousMeshName)
                        $("#lga-name" + app.element.id).html(meshCurrent.name);
                }
            }
        }
        //document.getElementById("csv-name" + app.element.id).innerHTML = dataCsv;
    }
}

/**
 * Update map and graph to csv with animation
 * @param app - SAGE2 app
 * @param dataCsv - string. Csv to display
 * @param csvPath - string. Path to csv file
 * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
 */
function updateMapGraphToCsv(app, dataCsv, csvPath, dataCsvStore) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            updateMapGraphToCsv(app, dataCsv, csvPath, dataCsvStore);
        }, app.haltTime);
    } else {
        app.currentCsv = dataCsv;
        app.timerOn = false;
        app.tick = 0.0;
        // Keep track of highlighted LGA if locked
        if (app.locked) {
            if (app.currentLgaSelected)
                app.mouseLgaHighlighted = app.currentLgaSelected;
            if (app.graphHighlightedLga)
                app.mouseLgaHighlighted = app.graphHighlightedLga.name;
        }
        deselectLgasHighlighted(app);
        loadInitialData(app);
        var previousDataLoader = app.dataLoader1;
        app.data1 = dataCsvStore[dataCsv]["data"];
        app.dataLoader1 = dataCsvStore[dataCsv]["dataLoader"];
        app.mapLoader1 = dataCsvStore[dataCsv]["mapLoader"];
        app.dataSelector1 = dataCsvStore[dataCsv]["dataSelector"];

        var currentDataLoader = app.dataLoader1;
        var scale;
        var lgaView = app.initialMapLoader.getLGAviews();
        var lgaView2 = dataCsvStore[dataCsv]["mapLoader"].getLGAviews();
        var selectData = app.selectDataSet;
        var meshCurrent, meshTarget;
        var initial, target;
        for (var id in lgaView) {
            if (lgaView.hasOwnProperty(id)) {
                for (var i = 0; i < selectData.length; i++) {
                    meshCurrent = lgaView[id].getDataMeshes()[selectData[i]];
                    meshTarget = lgaView2[id].getDataMeshes()[selectData[i]];
                    var meshCurrentData = previousDataLoader.getLGAsObject()[id].getDataPoint(selectData[i]).getDataValue();
                    var meshTargetData = currentDataLoader.getLGAsObject()[id].getDataPoint(selectData[i]).getDataValue();
                    if (!isFinite(meshCurrentData) || meshCurrentData == 0) meshCurrentData = 0.1; // Can't scale to 0
                    if (!isFinite(meshTargetData) || meshTargetData == 0) meshTargetData = 0.1;
                    scale = meshTargetData / meshCurrentData;
                    var lga = lgaView[id].getLGA().getName();
                    var selectDataLGA = selectData[i] + lga;
                    var previousMeshName = meshCurrent.name;
                    var currentLga = document.getElementById("lga-name" + app.element.id).innerHTML;

                    loadInitialMeshColoursValues(app, selectDataLGA, meshCurrent);

                    meshCurrent.name = meshTarget.name;

                    initial = {position: meshCurrent.position.z, scale: meshCurrent.scale.z};
                    initial['color0Red'] = meshCurrent.material.materials[0].color.r;
                    initial['color0Green'] = meshCurrent.material.materials[0].color.g;
                    initial['color0Blue'] = meshCurrent.material.materials[0].color.b;
                    initial['color2Red'] = meshCurrent.material.materials[2].color.r;
                    initial['color2Green'] = meshCurrent.material.materials[2].color.g;
                    initial['color2Blue'] = meshCurrent.material.materials[2].color.b;
                    target = {position: meshTarget.position.z, scale: meshCurrent.scale.z * scale};
                    target['color0Red'] = meshTarget.material.materials[0].color.r;
                    target['color0Green'] = meshTarget.material.materials[0].color.g;
                    target['color0Blue'] = meshTarget.material.materials[0].color.b;
                    target['color2Red'] = meshTarget.material.materials[2].color.r;
                    target['color2Green'] = meshTarget.material.materials[2].color.g;
                    target['color2Blue'] = meshTarget.material.materials[2].color.b;

                    // If next mesh target is same as initial csv mesh
                    if (meshCurrent.uuid == meshTarget.uuid) {
                        target['position'] = app.initialMeshPosition[selectDataLGA];
                        target['color0Red'] = app.initialColours[selectDataLGA][0]['red'];
                        target['color0Green'] = app.initialColours[selectDataLGA][0]['green'];
                        target['color0Blue'] = app.initialColours[selectDataLGA][0]['blue'];
                        target['color2Red'] = app.initialColours[selectDataLGA][2]['red'];
                        target['color2Green'] = app.initialColours[selectDataLGA][2]['green'];
                        target['color2Blue'] = app.initialColours[selectDataLGA][2]['blue'];
                        meshCurrent.name = app.initialValues[selectDataLGA];
                    }
                    // Update map info without mouse hover refresh
                    if (currentLga == previousMeshName)
                        $("#lga-name" + app.element.id).html(meshCurrent.name);
                    createTweenCSVChange(meshCurrent, initial, target);
                }
            }
        }
        document.getElementById("csv-name" + app.element.id).innerHTML = dataCsv;
        var currentCsvDataStore = dataCsvStore[dataCsv];
        updateMapAndGraph(app, csvPath, app.csvNoLGAs[dataCsv], currentCsvDataStore);
        app.timerOn = true;
    }
}

/**
 * Get index for next csv file to be updated to
 * @param selectCsv - array. Selected csv files
 * @param currentItem - string. Current csv file loaded.
 * @returns {Integer} - next index for csv to update to
 */
var getNextIndex = function(selectCsv, currentItem) {
    var nextIndex;
    for (var i = 0; i < selectCsv.length; i++) {
        if (currentItem == selectCsv[i]) {
            nextIndex = i + 1;
            if (nextIndex >= selectCsv.length) {
                nextIndex = 0;
            }
            break;
        }
    }
    return nextIndex;
};

/**
 * Cycle to next csv file
 * @param app - SAGE2 app
 * @param csv - string. Next csv to cycle to
 */
function cycleCsv(app, csv) {
    console.log('cycling');
    if (app.timerOn) {
        console.log(csv);
        app.csvPath = app.resrcPath + "data/" + csv;
        updateMapGraphToCsv(app, csv, app.csvPath, app.dataCsvStore);
    }
}

/**
 * Select menu csv item and update map and graph to csv file
 * @param currentItem - string. Name of menu csv item
 * @param csvMenuSelected - Object. Track what menu csv items are selected
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectColour - string. colour to change menu csv item
 */
var push_csv_menu_item_data = function (currentItem, csvMenuSelected, app, divSelect, selectColour) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            push_csv_menu_item_data(currentItem, csvMenuSelected, app, divSelect, selectColour);
        }, app.haltTime);
    } else {
        app.currentCsv = currentItem;
        app.timerOn = false;
        app.tick = 0.0;
        resetCsvNoLGAs(app.csvNoLGAs, app.noLGAs);
        app.selectCsv.push(currentItem);
        app.selectCsv.sort();
        var itemString = currentItem + app.element.id;
        csvMenuSelected[itemString][1] = true;
        csvMenuSelected[itemString][2] = selectColour;
        document.getElementById(itemString).style.color = csvMenuSelected[itemString][2];
        console.log(currentItem, itemString, app.csvPath, app.dataCsvStore);
        updateMap(app);
        getMaxYDomain_aux(app.selectDataSet, app.dataCsvStore, app.resrcPath, app.selectCsv, function (result) {
            app.maxYDomain = result;
            console.log('maxYdomain', app.maxYDomain);
            if (app.selectDataSet.length > 0) {
                app.csvPath = app.resrcPath + "data/" + currentItem;
                updateMapGraphToCsv(app, currentItem, app.csvPath, app.dataCsvStore);
            }
            app.threeRender1.renderOnce();
            app.currentIndex = getNextIndex(app.selectCsv, currentItem);
            app.timerOn = !app.paused;
        });
    }
};

/**
 * Deselect menu csv item and update map and graph to first selected csv file
 * @param currentItem - string. Name of menu csv item
 * @param csvMenuSelected - Object. Track what menu csv items are selected
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectColour - string. colour to change menu csv item
 */
var remove_csv_menu_item_data = function(currentItem, csvMenuSelected, app, divSelect, selectColour) {
    if (app.animating) {
        setTimeout(function () {
            console.log('halting');
            remove_csv_menu_item_data(currentItem, csvMenuSelected, app, divSelect, selectColour);
        }, app.haltTime);
    } else {
        app.timerOn = false;
        app.tick = 0.0;
        resetCsvNoLGAs(app.csvNoLGAs, app.noLGAs);
        if (currentItem == app.selectCsv[0]) {
            console.log('removing initial csv');
        }
        var itemString = currentItem + app.element.id;
        csvMenuSelected[itemString][1] = false;
        csvMenuSelected[itemString][2] = selectColour;
        document.getElementById(itemString).style.color = csvMenuSelected[itemString][2];
        var removeIndex = app.selectCsv.indexOf(currentItem);
        app.selectCsv.splice(removeIndex, 1);
        updateMap(app);
        getMaxYDomain_aux(app.selectDataSet, app.dataCsvStore, app.resrcPath, app.selectCsv, function (result) {
            app.maxYDomain = result;
            console.log('maxYdomain', app.maxYDomain);
            if (app.selectDataSet.length > 0) {
                var firstCsv = app.selectCsv[0];
                app.currentCsv = firstCsv;
                app.csvPath = app.resrcPath + "data/" + firstCsv;
                updateMapGraphToCsv(app, firstCsv, app.csvPath, app.dataCsvStore);
            }
            app.threeRender1.renderOnce();
            app.currentIndex = getNextIndex(app.selectCsv, firstCsv);
            app.timerOn = !app.paused;
        });
    }
};

/**
 * Perform action for selected menu csv item
 * @param csvMenuSelected - Object. Track what menu csv items are selected
 * @param menuItem - string. Name of menu csv item
 * @param app - SAGE2 app
 * @param divSelect - HTML element. DIV element where menu is created
 * @param selectColour - string. colour to change menu csv item
 * @param removeItem - boolean. Whether a menu csv item is to be deselected
 */
var select_csv_menu_item = function (csvMenuSelected, menuItem, app, divSelect, selectColour, removeItem) {
    var itemString = menuItem.substring(0, menuItem.indexOf("app"));
    csvMenuSelected[menuItem][2] = selectColour;
    document.getElementById(menuItem).style.color = csvMenuSelected[menuItem][2];
    if (!removeItem) {
        push_csv_menu_item_data(itemString, csvMenuSelected, app, divSelect, selectColour);
    } else {
        remove_csv_menu_item_data(itemString, csvMenuSelected, app, divSelect, selectColour);
    }
};

/**
 * Perform action when selecting menu csv item
 * @param app - SAGE2 app
 * @param csvMenuSelected - Object. Track what menu csv items are selected
 * @param divSelect - HTML element. DIV element where menu is created
 * @param menuDataUnselected - menu text data unselected colour
 * @param menuDataSelected - menu text data selected colour
 * @param menuDataHover - menu text data hover colour
 */
function csv_menu_click(app, csvMenuSelected, divSelect, menuDataUnselected, menuDataSelected, menuDataHover) {
    app.mouseSelectionDisabled = true;
    var item;
    for (item in csvMenuSelected) {
        if (csvMenuSelected.hasOwnProperty(item)) {
            // If menu item is moused over
            if (csvMenuSelected[item][1] === true) {
                // Remove unique menu item app
                // If menu item is moused over but not selected
                if (csvMenuSelected[item][2] === menuDataHover) {
                    select_csv_menu_item(csvMenuSelected, item, app, divSelect, menuDataSelected, false);
                    app.mouseSelectionDisabled = false;
                    return;
                } else {
                    // Unselect menu item
                    if (app.selectCsv.length > 1) {
                        select_csv_menu_item(csvMenuSelected, item, app, divSelect, menuDataUnselected, true);
                        app.mouseSelectionDisabled = false;
                        return;
                    } else {
                        app.mouseSelectionDisabled = false;
                        return;
                    }
                }
            }
        }
    }
}

/**
 * Lock mouse over information box
 * @param app - SAGE2 app
 * @param htmlElement - HTML element to change text
 * @param lockedMessage - string. Message to display when locked
 * @param unlockedMessage - string. Message to display when unlocked
 * @param pausedMessage - string. Message to display when paused
 * @param unpausedMessage - string. Message to display when unpaused
 * @param graphUnlockedColour - text colour graph unlocked status
 * @param graphLockedColour - text colour graph locked status
 */
function lock_info(app, htmlElement, lockedMessage, unlockedMessage, pausedMessage, unpausedMessage, graphUnlockedColour, graphLockedColour) {
    app.locked = !app.locked;
    var pauseStatus;
    if (app.paused) {
        pauseStatus = pausedMessage;
    } else {
        pauseStatus = unpausedMessage;
    }
    if (app.locked) {
        document.getElementById(htmlElement).innerHTML = lockedMessage + " " + pauseStatus;
        document.getElementById(htmlElement).style.color = graphLockedColour;
    } else {
        document.getElementById(htmlElement).innerHTML = unlockedMessage + " " + pauseStatus;
        document.getElementById(htmlElement).style.color = graphUnlockedColour;
    }
}
/**
 * Pause update to next csv file
 * @param htmlElement - HTML element to change text
 * @param lockedMessage - string. Message to display when locked
 * @param unlockedMessage - string. Message to display when unlocked
 * @param pausedMessage - string. Message to display when paused
 * @param unpausedMessage - string. Message to display when unpaused
 */
function pause(app, htmlElement, lockedMessage, unlockedMessage, pausedMessage, unpausedMessage) {
    app.paused = !app.paused;
    var lockStatus;
    if (app.locked) {
        lockStatus = lockedMessage;
    } else {
        lockStatus = unlockedMessage;
    }
    if (app.paused) {
        document.getElementById(htmlElement).innerHTML = lockStatus + " " + pausedMessage;
    } else {
        document.getElementById(htmlElement).innerHTML = lockStatus + " " + unpausedMessage;
    }
}

var map3d_sage2 = SAGE2_App.extend( {

	init: function(data) {
        this.SAGE2Init("div", data);

        this.tick = 0.0; // Timer for sync
        this.parseCsv = false; // Whether application has parsed csv files

        this.resizeEvents = "onfinish"; //"onfinish"; "continuous"


        this.element.id = data.id;
        this.element.style.fontFamily = "sans-serif";

        // Keep track of original width of app
        this.originalClientWidth = this.element.clientWidth;
        this.clientWidthDifference = null;

        // These ratios must add to 1 - for "full mode"
        this.fullMapWidthRatio = 0.35;
        this.fullGraphWidthRatio = 0.35;
        this.fullCsvMenuWidthRatio = 0.1;
        this.fullMenuWidthRatio = 0.1;
        this.fullKeyboardShortcutDisplayRatio = 0.1;

        // These ratios must add to 1 - for "basic mode"
        this.basicMapWidthRatio = 0.5;
        this.basicGraphWidthRatio = 0.5;
        this.basicCsvMenuWidthRatio = 0;
        this.basicMenuWidthRatio = 0;
        this.basicKeyboardShortcutDisplayRatio = 0;

        // These ratios must add to 1
        this.mapWidthRatio = this.fullMapWidthRatio;
        this.graphWidthRatio = this.fullGraphWidthRatio;
        this.csvMenuWidthRatio = this.fullCsvMenuWidthRatio;
        this.menuWidthRatio = this.fullMenuWidthRatio;
        this.keyboardShortcutDisplayRatio = this.fullKeyboardShortcutDisplayRatio;

        // Full UI
        this.fullMode = true;
        this.redrawGraph = true;

        // Menu selection colours
        this.menuDataUnselected = "black";
        this.menuDataSelected = "red";
        this.menuDataSelectedHover = "darkred";
        this.menuDataHover = "green";

        // Graph lock colour status
        this.graphUnlockedColour = "green";
        this.graphLockedColour = "red";

        console.log("this element is " + this.element);
        console.log(this.element.id, this.id);
        var divMain = document.createElement("div");
        divMain.id = "main" + data.id;

        var divCsvMenuSelection = document.createElement("div");
        divCsvMenuSelection.id = "csv_data" + data.id;

        var divCsvDataSelection = document.createElement("div");
        divCsvDataSelection.id = "csv_data_container" + data.id;

        var divMenuSelection = document.createElement("div");
        divMenuSelection.id = "main_data" + data.id;

        var divDataSelection = document.createElement("div");
        divDataSelection.id = "data_container" + data.id;

        var divInformation = document.createElement("div");
        divInformation.id = "main_container" + data.id;

        var divCommands = document.createElement("div");
        divCommands.id = "main_shortcut" + data.id;

        var divShortcutDisplay = document.createElement("div");
        divShortcutDisplay.id = "shortcut_container" + data.id;

        var ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        var li0 = document.createElement("li");
        li0.id = "csv-name" + data.id;
        var li = document.createElement("li");
        li.id = "lga-name" + data.id;
        li.innerHTML = "Move mouse over map";
        var li2 = document.createElement("li");
        li2.id = "lock" + data.id;
        li2.innerHTML = "Unlocked";
        li2.style.color = this.graphUnlockedColour;

        this.element.appendChild(divCommands);
        divCommands.appendChild(divShortcutDisplay);
        this.element.appendChild(divCsvMenuSelection);
        divCsvMenuSelection.appendChild(divCsvDataSelection);
        this.element.appendChild(divMenuSelection);
        divMenuSelection.appendChild(divDataSelection);
        this.element.appendChild(divInformation);
        divInformation.appendChild(ul);
        ul.appendChild(li0);
        ul.appendChild(li);
        ul.appendChild(li2);

        // Commands
        divCommands.style.backgroundColor = "darkseagreen";
        divCommands.style.height = "100%";
        divCommands.style.width = this.keyboardShortcutDisplayRatio * 100 + "%";
        divCommands.style.color = "black";
        divCommands.style.float = "right";
        divCommands.style.wordBreak = "break-word";

        divShortcutDisplay.style.paddingLeft = "1%";
        divShortcutDisplay.style.height = "inherit";
        this.shortcutFontFactor = 41;
        divShortcutDisplay.style.fontSize = this.element.clientHeight / this.shortcutFontFactor + "px";
        divShortcutDisplay.style.display = "flex";
        divShortcutDisplay.style.flexDirection = "column";
        divShortcutDisplay.style.justifyContent = "space-around";


        var ulShortcut = document.createElement("ul");
        divShortcutDisplay.appendChild(ulShortcut);

        var shortcutHeader = document.createElement("li");
        var shortcutHeaderText = document.createTextNode("Right Click for Menu");
        shortcutHeader.appendChild(shortcutHeaderText);
        shortcutHeader.style.fontWeight = "bold";
        ulShortcut.appendChild(shortcutHeader);

        var liShortcut, liText;
        var shortcuts = [
            "Auto Rotate",
            "Add/Remove LGA",
            "Lock LGA",
            "Clear All",
            "Get Top Ten",
            "Get Top Twenty",
            "Map Scale+",
            "Map Scale-",
            "Pause",
            "Change Mode"
        ];
        for (var i = 0; i < shortcuts.length; i++) {
            liShortcut = document.createElement("li");
            liText = document.createTextNode(shortcuts[i]);
            liShortcut.appendChild(liText);
            ulShortcut.appendChild(liShortcut);
        }

        ulShortcut.appendChild(document.createElement("br"));
        shortcutHeader = document.createElement("li");
        shortcutHeaderText = document.createTextNode("Mouse Commands");
        shortcutHeader.appendChild(shortcutHeaderText);
        shortcutHeader.style.fontWeight = "bold";
        ulShortcut.appendChild(shortcutHeader);

        shortcuts = [
            "Zoom In: Scroll Up",
            "Zoom Out: Scroll Down",
            "Rotate: Hold Left Click + Move"
        ];
        for (var i = 0; i < shortcuts.length; i++) {
            liShortcut = document.createElement("li");
            liText = document.createTextNode(shortcuts[i]);
            liShortcut.appendChild(liText);
            ulShortcut.appendChild(liShortcut);
        }

        ulShortcut.appendChild(document.createElement("br"));
        shortcutHeader = document.createElement("li");
        shortcutHeaderText = document.createTextNode("Keyboard Commands");
        shortcutHeader.appendChild(shortcutHeaderText);
        shortcutHeader.style.fontWeight = "bold";
        ulShortcut.appendChild(shortcutHeader);

        shortcuts = [
            "Pan Up: Arrow Up",
            "Pan Down: Arrow Down",
            "Pan Left: Arrow Left",
            "Pan Right: Arrow Right",
            "Lock LGA: Enter",
            "Add/Remove LGA: L",
            "CSV Menu Font+: I",
            "CSV Menu Font-: U",
            "Menu Font+: K",
            "Menu Font-: J",
            "Info Font+: H",
            "Info Font-: G",
            "Shortcut Font+: F",
            "Shortcut Font-: D",
            "Map Scale+: S",
            "Map Scale-: A",
            "Pause: P",
            "Change Mode: Q"
        ];
        for (var i = 0; i < shortcuts.length; i++) {
            liShortcut = document.createElement("li");
            liText = document.createTextNode(shortcuts[i]);
            liShortcut.appendChild(liText);
            ulShortcut.appendChild(liShortcut);
        }

        // Menu
        divMenuSelection.style.backgroundColor = "lightblue";
        divMenuSelection.style.height = "100%";
        divMenuSelection.style.width = this.menuWidthRatio * 100 + "%";
        divMenuSelection.style.color = this.menuDataUnselected;
        divMenuSelection.style.float = "right";
        divMenuSelection.style.wordBreak = "break-word";

        divDataSelection.style.paddingLeft = "1%";
        divDataSelection.style.height = "inherit";
        this.dataMenuFontFactor = 34;
        divDataSelection.style.fontSize = this.element.clientHeight / this.dataMenuFontFactor + "px";
        divDataSelection.style.display = "flex";
        divDataSelection.style.flexDirection = "column";
        divDataSelection.style.justifyContent = "space-around";

        // CSV data menu
        divCsvMenuSelection.style.backgroundColor = "lightsteelblue";
        divCsvMenuSelection.style.height = "100%";
        divCsvMenuSelection.style.width = this.csvMenuWidthRatio * 100 + "%";
        divCsvMenuSelection.style.color = this.menuDataUnselected;
        divCsvMenuSelection.style.float = "right";
        divCsvMenuSelection.style.wordBreak = "break-word";

        divCsvDataSelection.style.paddingLeft = "1%";
        divCsvDataSelection.style.height = "inherit";
        this.csvMenuFontFactor = 34;
        divCsvDataSelection.style.fontSize = this.element.clientHeight / this.csvMenuFontFactor + "px";
        divCsvDataSelection.style.display = "flex";
        divCsvDataSelection.style.flexDirection = "column";
        divCsvDataSelection.style.justifyContent = "space-around";

        // Information
        divInformation.style.backgroundColor = "white";
        divInformation.style.height = "100%";
        divInformation.style.width = this.graphWidthRatio * 100 + "%";
        divInformation.style.color = "black";
        divInformation.style.float = "right";
        divInformation.style.wordBreak = "break-word";
        this.infoFontFactor = 20;
        divInformation.style.fontSize = this.element.clientHeight / this.infoFontFactor + "px";

        this.csvMenuSelected = {}; // Keep track of CSV files selected
        this.menuSelected = {}; // Keep track of data sets selected
        this.selectDataSet = []; // Keep track of selected data sets
        this.selectLga = []; // Keep track of selected LGAs
        this.noLGAs = 10; // No. of LGAs to highlight on map and show on graph
        this.csvNoLGAs = {}; // Keep track of no. of LGAs for each CSV
        this.csvFileNames = []; // Store all csv file names
        this.dataCsvStore = {}; // Store CSV classes - data, dataLoader, threeRender, mapLoader and dataSelector

        // Extrude height for meshes
        this.extrudeHeight = 0.02;
        this.originalExtrudeHeight = this.extrudeHeight;

        // Keep track of initial CSV file loaded data
        this.initialMeshPosition = {};
        this.initialMapLoader = null;
        this.initialDataSelector = null;
        this.initialColours = {};
        this.initialValues = {};

        this.initialCsv = null; // Keep track of initial CSV file loaded
        this.currentCsv = null; // Current CSV displayed

        this.haltTime = 1000; // How long to halt in milliseconds

        map3d_init(this, data);

        // Disable mouse menu functionality
        this.mouseSelectionDisabled = false;

        // Lock and pause attributes
        this.locked = false;
        this.lockedMessage = "Locked";
        this.unlockedMessage = "Unlocked";
        this.paused = false;
        this.pausedMessage = "Paused";
        this.unpausedMessage = "Unpaused";
        li2.innerHTML = this.unlockedMessage + " " + this.unpausedMessage;

        // Keep track of whether software mouse of hovering graph
        this.graphHover = false;

        // LGAs mouse over and graph highlight attributes
        this.currentLgaSelected = null;
        this.lgasHighlighted = null;
        this.mouseLgaHighlighted = null;

        // Max Y domain for multiple csv stacked bar graphs
        this.maxYDomain = 0;

        this.controls.addButton({type: "prev", position: 1, identifier: "Left"});
        this.controls.addButton({type: "next", position: 7, identifier: "Right"});
        this.controls.addButton({type: "up-arrow", position: 4, identifier: "Up"});
        this.controls.addButton({type: "down-arrow", position: 10, identifier: "Down"});
        this.controls.addButton({type: "zoom-in", position: 12, identifier: "ZoomIn"});
        this.controls.addButton({type: "zoom-out", position: 11, identifier: "ZoomOut"});
        this.controls.addButton({type: "loop", position: 2, identifier: "Loop"});
        this.controls.addButton({label: "Add", position: 3, identifier: "Add"});
        this.controls.addButton({label: "Lock", position: 5, identifier: "Lock"});
        this.controls.addButton({label: "Top10", position: 8, identifier: "TopTen"});
        this.controls.addButton({label: "Top20", position: 9, identifier: "TopTwenty"});
        this.controls.addButton({label: "Clear", position: 6, identifier: "ClearAll"});
        this.controls.addButton({label: "Map+", position: 15, identifier: "ScaleUp"});
        this.controls.addButton({label: "Map-", position: 16, identifier: "ScaleDown"});
        this.controls.addButton({label: "Pause", position: 21, identifier: "Pause"});
        this.controls.addButton({label: "Mode", position: 25, identifier: "ChangeMode"});
        this.controls.finishedAddingControls();


        //console.log(this);
        console.log("map3d_sage2.js Version 4");
    },

	load: function(date) {
        this.refresh(date);
	},


	draw: function(date) {

        /**
         * Re-highlight LGA
         * @param app - SAGE2 app
         * @param dataSelector - class. Select which data to display.
         */
        function rehighlightLGA(app, dataSelector) {
            var lgaView;
            if (app.mouseLgaHighlighted) {
                if (app.initialMapLoader && app.lgasHighlighted[app.mouseLgaHighlighted]) {
                    lgaView = app.initialMapLoader.getLGAviews();
                } else {
                    lgaView = app.mapLoader1.getLGAviews();
                }
                var mesh;
                for (var j = 0; j < app.selectDataSet.length; j++) {
                    mesh = lgaView[app.lgasId[app.mouseLgaHighlighted]].getDataMeshes()[app.selectDataSet[j]];
                    dataSelector.updateMapMouseover(app.lgasId[app.mouseLgaHighlighted]);
                }
                app.threeRender1.renderOnce();
                app.lgasHighlighted[app.mouseLgaHighlighted] = false;
                app.mouseLgaHighlighted = null;
            }
        }

		if (this.ready) {
			this.threeRender1.getCamControls().update();
			this.threeRender1.clearRenderer();
			this.threeRender1.renderOnce();
		}
        // Wait for parsing of csvs
        if (this.latestCsv != null && this.parseCsv == false) {
            this.selectCsv = [this.latestCsv];
            this.currentIndex = 0;
            this.parseCsv = true;
        }
        if (this.parseCsv) {
            if (this.selectCsv.length > 1 && this.selectDataSet.length > 0 && this.timerOn) {
                this.tick += this.dt;
                if (this.tick >= 4.0) {
                    this.tick = 0.0;
                    console.log('iterating');
                    cycleCsv(this, this.selectCsv[this.currentIndex]);
                    this.currentIndex++;
                    if (this.currentIndex >= this.selectCsv.length) {
                        this.currentIndex = 0;
                    }
                }
            }
        }
        if (TWEEN.update()) {
            this.animating = true;
            this.threeRender1.renderOnce();
        } else {
            this.animating = false;
            var dataSelector = this.initialDataSelector;
            if (!this.initialDataSelector) {
                dataSelector = this.dataSelector1;
            }
            rehighlightLGA(this, dataSelector);
        }
	},

	resize: function(date) {
        this.timerOn = false;
        var height = this.element.clientHeight;
        this.threeRender1.setRendererSize(this.mapWidthRatio * this.element.clientWidth, height);
		this.refresh(date);  // this doesn't redraw?
        this.threeRender1.renderOnce();
        document.getElementById("csv_data_container" + this.element.id).style.fontSize = this.element.clientHeight / this.csvMenuFontFactor + "px";
        document.getElementById("data_container" + this.element.id).style.fontSize = this.element.clientHeight / this.dataMenuFontFactor + "px";
        document.getElementById("main_container" + this.element.id).style.fontSize = this.element.clientHeight / this.infoFontFactor + "px";
        document.getElementById("shortcut_container" + this.element.id).style.fontSize = this.element.clientHeight / this.shortcutFontFactor + "px";
        if (this.redrawGraph) {
            console.log('redrawing graph');
            // If redrawing graph
            // If chart exists, delete and create new one
            updateGraphAllCsvs(this, this.csvPath, this.csvNoLGAs[this.currentCsv], this.currentCsv);
        } else {
            this.redrawGraph = true;
        }
        this.timerOn = !this.paused;
	},

	event: function(eventType, position, user_id, data, date) {

        var dataSelector = this.initialDataSelector;
        if (!this.initialDataSelector) {
            dataSelector = this.dataSelector1;
        }
        var mapLoader = this.initialMapLoader;
        if (!this.initialMapLoader) {
            mapLoader = this.mapLoader1;
        }

        /**
         * Returns
         * @param intersected - object. LGA mesh mouse is hovering
         * @returns mouseOverLga - string. Name of LGA mouse is hovering
         */
        var getMouseOverLga = function(intersected) {
            if (intersected !== null) {
                var indexSlice = intersected.name.indexOf("0");
                var mouseOverLga = intersected.name;
                if (indexSlice !== -1) {
                    mouseOverLga = intersected.name.slice(0, indexSlice);
                }
                indexSlice = mouseOverLga.indexOf(":");
                if (indexSlice !== -1) {
                    mouseOverLga = mouseOverLga.slice(0, indexSlice);
                }
                return mouseOverLga;
            }
        };

        /**
         * Add/Remove LGA to stacked bar chart
         * @param app - SAGE2 app
         * @param dataSelector - class. Select which data to display.
         * @param initialDataSelector - class. dataSelector for initial csv
         */
        var add_remove_lga = function(app, dataSelector, initialDataSelector) {
            var currentLga = document.getElementById("lga-name" + app.element.id).innerHTML;
            if ("Move mouse over map".indexOf(currentLga) === -1) {
                var indexSlice = currentLga.indexOf(":");
                currentLga = currentLga.slice(0, indexSlice);
                var currentLgaIndex = app.selectLga.map(function (lga) {
                    return lga.name;
                }).indexOf(currentLga);
                var currentLgaObject = dataSelector.getLgaTotalData(currentLga);
                // Adding LGA to graph
                if (currentLgaIndex === -1) {
                    app.csvNoLGAs[app.currentCsv]++;
                    // Make mesh colour of selected
                    initialDataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLgaObject);
                    dataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLgaObject);
                    // Removing LGA from graph
                } else {
                    app.csvNoLGAs[app.currentCsv]--;
                    initialDataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLgaObject, true);
                    dataSelector.updateSingleDataColourSelected(app.selectDataSet, currentLgaObject, true);
                    app.graphItemSelection = false;
                }
                app.selectLga = dataSelector.getTopNumberLga(app.csvNoLGAs[app.currentCsv]);
                if (initialDataSelector == dataSelector) {
                    app.initialColours = {};
                }
                app.threeRender1.renderOnce();
            }
            if (document.getElementById("stackedBarChart" + app.element.id)) {
                document.getElementById("main_container" + app.element.id).removeChild(document.getElementById("stackedBarChart" + app.element.id));
                stacked_bar_graph(app.element.id, app.element.clientHeight, document.getElementById("main_container" + app.element.id), app.csvPath, app.selectDataSet, app.selectLga, app.dataSetColours, false, app.maxYDomain);
                app.dataCsvStore[app.currentCsv]["bar_graph"] = document.getElementById("stackedBarChart" + app.element.id);
            }
        };

        var graphStartingWidth = this.mapWidthRatio * this.element.clientWidth;
        var graphEndingWidth = graphStartingWidth + this.graphWidthRatio * this.element.clientWidth;
        var menuStartingWidth = graphEndingWidth;
        var menuEndingWidth = menuStartingWidth + this.menuWidthRatio * this.element.clientWidth;
        var csvMenuStartingWidth = menuEndingWidth;
        var csvMenuEndingWidth = csvMenuStartingWidth + this.csvMenuWidthRatio * this.element.clientWidth;

        if (eventType === "pointerPress" && (data.button === "left")) {
            if (position.x < menuStartingWidth)
                this.dragging = true;
            this.threeRender1.getCamControls().mouseDown(position.x, position.y, 0);
            console.log('eventType === "pointerPress" && (data.button === "left"); called mousedown; position.x,y:'+position.x+','+position.y);

        } else if (eventType === "pointerPress" && (data.button === "right")) {
            this.dragging = true;
            this.threeRender1.getCamControls().mouseDown(position.x, position.y, 2);
            console.log('eventType === "pointerPress" && (data.button === "right"); called mousedown; position.x,y:'+position.x+','+position.y);

        } else if (eventType === "pointerMove" && this.dragging) {
            this.threeRender1.getCamControls().mouseMove(position.x, position.y);
            this.refresh(date);
            console.log('eventType === "pointerMove" && this.dragging; called mousemove; position.x,y:'+position.x+','+position.y);
        } else if (eventType === "pointerRelease" && (data.button === "left")) {
            var divSelect = document.getElementById("main_container" + this.element.id);
            if (position.x > menuStartingWidth && position.x < menuEndingWidth) {
                menu_click(this, this.menuSelected, this.groupedDataVariables, divSelect, this.selectDataSet, this.menuDataUnselected, this.menuDataSelected, this.menuDataHover);
            } else if (position.x > csvMenuStartingWidth && position.x < csvMenuEndingWidth) {
                csv_menu_click(this, this.csvMenuSelected, divSelect, this.menuDataUnselected, this.menuDataSelected, this.menuDataHover);
            }
            this.dragging = false;

        } else if (eventType === "pointerRelease" && (data.button === "right")) {
            this.dragging = false;
            console.log('eventType === "pointerRelease" && (data.button === "right"); this.dragging=false called; position.x,y:'+position.x+','+position.y);

        } else if (eventType === "pointerMove") {
            this.refresh(date);
            if (position.x > graphStartingWidth && position.x < graphEndingWidth) {
                this.graphHover = true;
            } else {
                this.graphHover = false;
                if (!this.locked) {
                    this.mouse.x = (position.x / (this.element.clientWidth * this.mapWidthRatio) * 2 - 1);
                    this.mouse.y = -(position.y / this.element.clientHeight * 2 - 1);
                }
            }
            menu_selection(csvMenuStartingWidth, csvMenuEndingWidth, this.element.clientHeight, position.x, position.y, this.csvMenuSelected, this.csvFileNames.length, this.menuDataUnselected, this.menuDataSelected, this.menuDataSelectedHover, this.menuDataHover, this.mouseSelectionDisabled);
            menu_selection(menuStartingWidth, menuEndingWidth, this.element.clientHeight, position.x, position.y, this.menuSelected, this.menuSize, this.menuDataUnselected, this.menuDataSelected, this.menuDataSelectedHover, this.menuDataHover, this.mouseSelectionDisabled);
            this.positionX = position.x;
            if (position.x < graphStartingWidth) {
                if (!this.animating) {
                    // When mouse hovers LGA
                    if (this.INTERSECTED && !this.locked && this.positionX < this.mapWidthRatio * this.element.clientWidth) {
                        $("#lga-name" + this.element.id).html(this.INTERSECTED.name);
                        var mouseOverLga = getMouseOverLga(this.INTERSECTED);
                        if (this.currentLgaSelected !== "NA" && this.currentLgaSelected !== mouseOverLga) {
                            dataSelector.updateMapMouseover(this.lgasId[this.currentLgaSelected], true);
                        }
                        this.currentLgaSelected = mouseOverLga;
                        this.lgasHighlighted[mouseOverLga] = true;
                        dataSelector.updateMapMouseover(this.lgasId[mouseOverLga]);
                        // When mouse hovers map but not an LGA
                    } else if (!this.locked && !this.graphHover) {
                        $("#lga-name" + this.element.id).html("Move mouse over map");
                        for (var i = 0; i < this.data1.length; i++) {
                            this.currentLgaSelected = this.data1[i].LGA_name;
                            if (this.lgasHighlighted[this.currentLgaSelected] === true) {
                                dataSelector.updateMapMouseover(this.lgasId[this.currentLgaSelected], true);
                                this.lgasHighlighted[this.currentLgaSelected] = false;
                            }
                        }
                        // Unselect map and graph highlight
                        if (this.graphHighlightedLga) {
                            var graphRectangle = document.getElementById("graphRectangle" + this.graphItemSelection + this.element.id);
                            if (graphRectangle)
                                graphRectangle.style.opacity = 1;
                            dataSelector.updateDataMouseover(this.graphHighlightedLga.id, true);
                            this.graphItemSelection = false;
                            this.graphHighlightedLga = false;
                        }
                    }
                    this.threeRender1.renderOnce();
                }
            // When mouse hovers graph
            } else {
                if (!this.locked && this.graphHover && !this.graphHighlightedLga) {
                    $("#lga-name" + this.element.id).html("Move mouse over map");
                    if (this.currentLgaSelected !== "NA" && typeof this.currentLgaSelected !== "undefined") {
                        dataSelector.updateMapMouseover(this.lgasId[this.currentLgaSelected], true);
                        this.lgasHighlighted[this.currentLgaSelected] = false;
                    }
                } else if (!this.locked && position.x > graphEndingWidth) {
                    // Unselect map and graph highlight
                    if (this.graphHighlightedLga) {
                        document.getElementById("lga-name" + this.element.id).innerHTML = "Move mouse over map";
                        document.getElementById("graphRectangle" + this.graphItemSelection + this.element.id).style.opacity = 1;
                        dataSelector.updateDataMouseover(this.graphHighlightedLga.id, true);
                        this.graphItemSelection = false;
                        this.graphHighlightedLga = false;
                    }
                }
            }
            if (document.getElementById("stackedBarChart" + this.element.id) && this.selectDataSet.length > 0 && this.graphHover) {
                graph_mouse_over(this, this.mapWidthRatio * this.element.clientWidth, (this.mapWidthRatio + this.graphWidthRatio) * this.element.clientWidth, position.x, this.selectLga, this.locked, this.element.id, this.graphItemSelection);
                this.threeRender1.renderOnce();
            }

            //console.log('eventType === "pointerMove" called mousemove; position.x,y:' + position.x + ',' + position.y);
        }
        if (eventType === "pointerScroll") {
            this.threeRender1.getCamControls().scale(- data.wheelDelta);  //negative to reverse scroll direction
            this.refresh(date);
            console.log('eventType === "pointerScroll"; called scale by (-ve,) data.wheelDelta:'+ data.wheelDelta);
        }

        if (eventType === "keyboard") {
            if (data.character === " ") {
                this.rotating = !this.rotating;
                this.threeRender1.getCamControls().autoRotate = this.rotating;
                this.refresh(date);
            }
        }

        /**
         * Pan map camera up
         * @param app - SAGE2 app
         */
        var panUp = function(app) {
            app.threeRender1.getCamControls().pan(0, -app.threeRender1.getCamControls().keyPanSpeed);
            app.threeRender1.getCamControls().update();
        };

        /**
         * Pan map camera down
         * @param app - SAGE2 app
         */
        var panDown = function(app) {
            app.threeRender1.getCamControls().pan(0, app.threeRender1.getCamControls().keyPanSpeed);
            app.threeRender1.getCamControls().update();
        };

        /**
         * Pan map camera left
         * @param app - SAGE2 app
         */
        var panLeft = function(app) {
            app.threeRender1.getCamControls().pan(-app.threeRender1.getCamControls().keyPanSpeed, 0);
            app.threeRender1.getCamControls().update();
        };

        /**
         * Pan map camera right
         * @param app - SAGE2 app
         */
        var panRight = function(app) {
            app.threeRender1.getCamControls().pan(app.threeRender1.getCamControls().keyPanSpeed, 0);
            app.threeRender1.getCamControls().update();
        };

        /**
         * Change application mode (full or basic)
         * @param app - SAGE2 app
         */
        var changeMode = function(app) {
            app.fullMode = !app.fullMode;
            // Change to "basic mode"
            if (!app.fullMode) {
                app.redrawGraph = false;
                app.originalClientWidth = app.element.clientWidth;
                var newClientWidth = app.originalClientWidth * (app.mapWidthRatio + app.graphWidthRatio);
                app.clientWidthDifference = parseInt(app.originalClientWidth - newClientWidth);
                app.sendResize(newClientWidth, app.element.clientHeight);
                app.mapWidthRatio = app.basicMapWidthRatio;
                app.graphWidthRatio = app.basicGraphWidthRatio;
                app.csvMenuWidthRatio = app.basicCsvMenuWidthRatio;
                app.menuWidthRatio = app.basicMenuWidthRatio;
                app.keyboardShortcutDisplayRatio = app.basicKeyboardShortcutDisplayRatio;
                // Back to original "full mode"
            } else {
                // Redraw graph if not going to previous  "full mode" application size
                app.redrawGraph = !(Math.abs(app.originalClientWidth - app.element.clientWidth - app.clientWidthDifference) <= 1);

                app.sendResize(app.originalClientWidth, app.element.clientHeight);
                app.mapWidthRatio = app.fullMapWidthRatio;
                app.graphWidthRatio = app.fullGraphWidthRatio;
                app.csvMenuWidthRatio = app.fullCsvMenuWidthRatio;
                app.menuWidthRatio = app.fullMenuWidthRatio;
                app.keyboardShortcutDisplayRatio = app.fullKeyboardShortcutDisplayRatio;
            }
            var csvDataContainer = document.getElementById("csv_data" + app.element.id);
            csvDataContainer.style.width = app.csvMenuWidthRatio * 100 + "%";

            var dataContainer = document.getElementById("main_data" + app.element.id);
            dataContainer.style.width = app.menuWidthRatio * 100 + "%";

            var mainContainer = document.getElementById("main_container" + app.element.id);
            mainContainer.style.width = app.graphWidthRatio * 100 + "%";

            var shortcutContainer = document.getElementById("main_shortcut" + app.element.id);
            shortcutContainer.style.width = app.keyboardShortcutDisplayRatio * 100 + "%";
        };
        if (eventType === "specialKey") {
            if (data.code === 37 && data.state === "down") { // left
                panLeft(this);
                this.refresh(date);
            } else if (data.code === 38 && data.state === "down") { // up
                panUp(this);
                this.refresh(date);
            } else if (data.code === 39 && data.state === "down") { // right
                panRight(this);
                this.refresh(date);
            } else if (data.code === 40 && data.state === "down") { // down
                panDown(this);
                this.refresh(date);
            } else if (data.code === 13 && data.state === "down") {// enter
                lock_info(this, "lock" + this.element.id, this.lockedMessage, this.unlockedMessage, this.pausedMessage, this.unpausedMessage, this.graphUnlockedColour, this.graphLockedColour);
                if (!this.locked && (this.positionX < this.mapWidthRatio * this.element.clientWidth || this.positionX > (this.mapWidthRatio + this.graphWidthRatio) * this.element.clientWidth)) {
                    // When lga in graph is unlocked and mouse is at location other than graph clear map and graph highlight
                    if (document.getElementById("graphRectangle" + this.graphItemSelection + this.element.id)) {
                        document.getElementById("graphRectangle" + this.graphItemSelection + this.element.id).style.opacity = 1;
                        dataSelector.updateDataMouseover(this.graphHighlightedLga.id, true);
                    }
                    // Clear for unlocked lga which did not appear on graph
                    var mouseOverLga = getMouseOverLga(this.INTERSECTED);
                    if (this.currentLgaSelected !== "NA" && this.currentLgaSelected !== mouseOverLga) {
                        dataSelector.updateMapMouseover(this.lgasId[this.currentLgaSelected], true);
                        this.lgasHighlighted[this.currentLgaSelected] = false;
                    }
                    this.threeRender1.renderOnce();
                }
            } else if (data.code === 76 && data.state === "down") { // L
                if (!this.animating)
                    add_remove_lga(this, this.dataCsvStore[this.currentCsv]["dataSelector"], dataSelector);
            } else if (data.code === 73 && data.state === "down") { // I
                // Increase csv menu font
                var csvFontSize = document.getElementById("csv_data_container" + this.element.id).style.fontSize;
                document.getElementById("csv_data_container" + this.element.id).style.fontSize = parseFloat(csvFontSize) * 1.05 + "px";
            } else if (data.code === 85 && data.state === "down") { // U
                // Decrease csv menu font
                var csvFontSize = document.getElementById("csv_data_container" + this.element.id).style.fontSize;
                document.getElementById("csv_data_container" + this.element.id).style.fontSize = parseFloat(csvFontSize) / 1.05 + "px";
            } else if (data.code === 75 && data.state === "down") { // K
                // Increase menu font
                var dataFontSize = document.getElementById("data_container" + this.element.id).style.fontSize;
                document.getElementById("data_container" + this.element.id).style.fontSize = parseFloat(dataFontSize) * 1.05 + "px";
            } else if (data.code === 74 && data.state === "down") { // J
                // Decrease menu font
                var dataFontSize = document.getElementById("data_container" + this.element.id).style.fontSize;
                document.getElementById("data_container" + this.element.id).style.fontSize = parseFloat(dataFontSize) / 1.05 + "px";
            } else if (data.code === 72 && data.state === "down") { // H
                // Increase information font
                var mainFontSize = document.getElementById("main_container" + this.element.id).style.fontSize;
                document.getElementById("main_container" + this.element.id).style.fontSize = parseFloat(mainFontSize) * 1.05+ "px";
            } else if (data.code === 71 && data.state === "down") { // G
                // Decrease information font
                var mainFontSize = document.getElementById("main_container" + this.element.id).style.fontSize;
                document.getElementById("main_container" + this.element.id).style.fontSize = parseFloat(mainFontSize) / 1.05 + "px";
            } else if (data.code === 70 && data.state === "down") { // F
                // Increase keyboard shortcut font
                var keyboardShortcutFontSize = document.getElementById("shortcut_container" + this.element.id).style.fontSize;
                document.getElementById("shortcut_container" + this.element.id).style.fontSize = parseFloat(keyboardShortcutFontSize) * 1.05+ "px";
            } else if (data.code === 68 && data.state === "down") { // D
                // Decrease keyboard shortcut font
                var keyboardShortcutFontSize = document.getElementById("shortcut_container" + this.element.id).style.fontSize;
                document.getElementById("shortcut_container" + this.element.id).style.fontSize = parseFloat(keyboardShortcutFontSize) / 1.05 + "px";
            } else if (data.code === 83 && data.state === "down") { // S
                scaleMap(this, true);
            } else if (data.code === 65 && data.state === "down") { // A
                scaleMap(this, false);
            } else if (data.code === 80 && data.state === "down") { // P
                this.timerOn = !this.timerOn;
                pause(this, "lock" + this.element.id, this.lockedMessage, this.unlockedMessage, this.pausedMessage, this.unpausedMessage);
            } else if (data.code === 81 && data.state === "down") { // Q
                changeMode(this);
            } else if (data.code === 87 && data.state === "down") { // W
            }
        } else if (eventType === "widgetEvent") {
            switch (data.identifier) {
                case "Up":
                    // up
                    panUp(this);
                    break;
                case "Down":
                    // down
                    panDown(this);
                    break;
                case "Left":
                    // left
                    panLeft(this);
                    break;
                case "Right":
                    // right
                    panRight(this);
                    break;
                case "ZoomIn":
                    var count = 4;
                    for (var i = 0; i < count; i++)
                        this.threeRender1.getCamControls().scale(40);
                    break;
                case "ZoomOut":
                    var count = 4;
                    for (var i = 0; i < count; i++)
                        this.threeRender1.getCamControls().scale(-40);
                    break;
                case "Loop":
                    this.rotating = !this.rotating;
                    this.threeRender1.getCamControls().autoRotate = this.rotating;
                    break;
                case "Add":
                    if (!this.animating)
                        add_remove_lga(this, this.dataCsvStore[this.currentCsv]["dataSelector"], dataSelector);
                    break;
                case "TopTen":
                    updateMapAndGraphTopNo(this, this.dataSelector1, mapLoader, 10);
                    break;
                case "TopTwenty":
                    updateMapAndGraphTopNo(this, this.dataSelector1, mapLoader, 20);
                    break;
                case "ClearAll":
                    updateMapAndGraphTopNo(this, this.dataSelector1, mapLoader, 0);
                    this.graphHighlightedLga = false;
                    break;
                case "ScaleUp":
                    scaleMap(this, true);
                    break;
                case "ScaleDown":
                    scaleMap(this, false);
                    break;
                case "Lock":
                    lock_info(this, "lock" + this.element.id, this.lockedMessage, this.unlockedMessage, this.pausedMessage, this.unpausedMessage, this.graphUnlockedColour, this.graphLockedColour);
                    break;
                case "Pause":
                    this.timerOn = !this.timerOn;
                    pause(this, "lock" + this.element.id, this.lockedMessage, this.unlockedMessage, this.pausedMessage, this.unpausedMessage);
                    break;
                case "ChangeMode":
                    changeMode(this);
                    break;
                default:
                    console.log("No handler for:", data.ctrlId);
                    return;
				}
				this.refresh(date);
			}


	}

});

var mouse = { x: 0, y: 0};
