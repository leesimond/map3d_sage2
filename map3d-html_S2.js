/**
 * Created by Vince Cheng on 14/07/15.
 * Version V2+ by Simond Lee
 * Web App: Visualisation of data geographically
 */

"use strict";


// Model Module ------------------------------------------------------------------------------------

// LGA class
/**
 * Create an LGA in the model
 * @param id - integer (for Victoria, 5 digit int starting with 2)
 * @param name - string
 * @constructor
 */
var Lga = function(id, name) {
    var dataPoints = [];

    this.totalDataValue = 0;

    /**
     * Add val to LGA's totalDataValue
     * @param val - value to add to totalDataValue
     */
    this.addToTotalDataValue = function(val) {
        this.totalDataValue += val;
    };

    /**
     * Get LGA's totalDataValue
     * @returns {number}
     */
    this.getTotalDataValue = function() {
        return this.totalDataValue;
    };

    /**
     * Set LGA's totalDataValue to val
     * @param val - value to set LGA's totalDataValue
     */
    this.setTotalDataValue = function(val) {
        this.totalDataValue = val;
    };

    /**
     * Get LGA's id - Integer (for Victoria, 5 digit int starting with 2)
     * @returns {Number}
     */
    this.getLGAid = function() {
        return id;
    };

    /**
     * Get the name of LGA as string.
     * @returns {String}
     */
    this.getName = function() {
        return name;
    };

    /**
     * Get a dataPoint from the LGA's list of dataPoints. Returns undefined if none matching idString
     * @param idString - string
     * @returns {DataPoint}
     */
    this.getDataPoint = function(idString) {
        for (var i=0; i<dataPoints.length; i++) {
            if (dataPoints[i].getDataPointID() == idString) {
                return dataPoints[i];
            }
        }
    };

    /**
     * Add a DataPoint to the array of dataPoints held by the Lga object.
     * @param DataPoint - a DataPoint object
     */
    this.addDataPoint = function(DataPoint) {
        dataPoints[dataPoints.length] = DataPoint;  // add DataPoint at end of dataPoints
    };

    /**
     * Get all the DataPointID strings for all the DataPoint objects held by this Lga object.
     * @returns {Array}
     */
    this.getDataPointIDs = function() {
        var idArray = [];
        for (var i=0; i<dataPoints.length; i++) {
            idArray.push(dataPoints[i].getDataPointID());
        }
        return idArray;
    };

};


// DataPoint concrete class
/**
 * Create a DataPoint to attach to an LGA
 * @param idString - string
 * @param dataValue - Floating Point or integer
 * @constructor
 */
var DataPoint = function(idString, dataValue) {

    /* Privileged Getters */

    /**
     * Get DataPoint ID
     * @returns {String}
     */
    this.getDataPointID = function(){
        return idString;
    };
    /**
     * Get DataValue - returns floating point or integer
     * @returns {Number}
     */
    this.getDataValue = function() {
        return dataValue;
    };
};
    DataPoint.prototype.constructor = DataPoint;




// View Module ----------------------------------------------------------------------------------

/**
 * A LGAview that contains references to THREE.Mesh objects visualising data and can be manipulated to display certain meshes.
 * Assumes there is a globally accessible "scene" variable of type THREE.Scene()
 * Responsible for adding and removing scene objects, not for calling render()
 * @param myLGA - Lga object that the view will observe and display the data of
 * @param d3threeD_meshes - Array of meshes from [d3-threeD] transformSVGPathExposed(feature);
 * @param threeRender - a threeRender which has the scene to render in.
 * @constructor
 */
var LGAview = function(myLGA, d3threeD_meshes, threeRender) {
    var id = myLGA.getLGAid();
    var name = myLGA.getName();

    // key - as DataPoint.idString : value - as actual Mesh (reference)
    var dataMeshes = {};

    // Convert d3threeD_mesh into mapMeshes:
    // For all meshes in this LGA from .shp file, base layer for regions.
    var mapMeshes = [];
    // For creating mapMeshes:
    var mapGeometries = [];

    var rotateX =  Math.PI;
    var translateX = -1007;
    var translateY = -127;
    var translateZ = 0;
    // For multiple data point, height totaller:
    var dataTranslateZ = 0;

    /**
     * Adds all the mapMeshes of an LGA to the scene
     * d3threeD_meshes[] provides stuff from transformSVGPathExposed(feature)
     * (we only need to convert it to a three.js path)
     */
    var addMapMeshes = function() {
        // Create Material
        for (var i = 0 ; i < d3threeD_meshes.length ; i++) {

            // Create Material, color based on LGA_id
            var material = new THREE.MeshPhongMaterial({
                //color: this.getCountryColor(lgas[i].data),
                //color: 0x0000ff,
                color: ((id - 20000) / 10000 * 0xffffff),
                //,opacity: 0.5  // transparent: true, must be defined for opacity to work
                side: THREE.DoubleSide
            });

            // Extrude mesh from d3threeD (that doesn't have material)
            ///*  Previous Version - extrude material black ---------------------
            var shape3d = d3threeD_meshes[i].extrude({
                amount: 0.001, //don't extrude mapMesh much -((lgas[i].data.LGA_ID - 20000) * extrudeHeight),  // similar effect as mesh.scale.z
                material: 0,
                extrudeMaterial: 0,
                bevelEnabled: false
            });
            // Add geometry/mesh without material to mapGeometries
            mapGeometries.push(shape3d);

            // Create a THREE.Mesh based on extruded shape and material
            var toAdd = new THREE.Mesh(shape3d, material);
            //*/ -----------------------------------------------------------------

            //set name of mesh
            toAdd.name = name + i;

            /*  COMMENT ME TO UNCOMMENT BELOW DEBUGGING CONSOLE.LOG:
            if (i == d3threeD_meshes.length - 1) {  //Debugging - only log if last material for LGA
                console.log("material.id: " + material.id + ", toAdd.name: " + toAdd.name);
            }
            /**/

            // rotate and position the elements (Victoria) - to near the origin
            toAdd.rotation.x = rotateX ;  // Rotate first to avoid complications.
            toAdd.translateX(translateX);
            toAdd.translateY(translateY);
            //newDataMesh.translateZ(translateZ);

            // Scale elements (extrude)
            //toAdd.scale.z = -((lgas[i].data.LGA_CODE - 300) * extrudeHeight);  //same effect as .extrude { amount: }

            // Add Mesh to mapMeshes
            mapMeshes.push(toAdd);

            // add to scene
            threeRender.getScene().add(toAdd);
        }

        // Debugging use ---------------
        //console.log("--Outputting  and then mapMeshes:");
        //console.log(mapGeometries);
        //console.log(mapMeshes);
        // END Debugging ---------------

    }();  // Run this when an LGAview is created.


    /**
     * Returns a number by multiplying charCodes of each char in String.
     * @param string
     */
    var stringToNumber = function(string) {
        var number=1;
        for (var i = 0; i < string.length; i++) {
            if (i%2 == 0) {  // diversify functions so blue values (bottom 2 hex digits) get updated too
                number += string.charCodeAt(i);
            } else {
            number *= string.charCodeAt(i);
            }

            // Make sure number doesn't exceed FP/Double limits
            var limit = 1e16;  //EDIT ME TO CHANGE LIMIT. 0xffffff=1.6777215e7
            if (number > limit) {
                //console.log("Number before limitting: "+number);
                number = number % limit;
                //console.log("Number limited: "+number);
            }
        }
        //console.log("stringToNumber("+string+") = "+number);  // Debugging
        return number;
    };

    /**
     * Generate HSL heat map rainbow colour based on value
     * @param value - number. Must be between 0 and 1
     * @returns {String} - HSL format
     */
    var heatMapColourValue = function(value) {
        if (isNaN(value)) {
            return "hsl(0, 100%, 0%)";
        }
        var h = (1.0 - value) * 240;
        return "hsl(" + h + ", 100%, 50%)";
    };

    /**
     * Generate HSL heat map red colour based on value
     * @param value - number. Must be between 0 and 1
     * @returns {String} - HSL format
     */
    var heatMapColourValueRed = function(value) {
        if (isNaN(value)) {
            return "hsl(0, 100%, 100%)";
        }
        //Grayscale
        //return "hsl(0, " + parseInt(value * 100) + "%, 50%)";
        //RGB
        //value = parseInt((1 - value) * 255);
        //return "rgb(255, " + value + ", " + value + ")";
        //HSL
        return "hsl(0, 100%, " + parseInt(((1 - value) * 50) + 50) + "%)";
    };

    /**
     * Generate HSL heat map blue colour based on value
     * @param value - number. Must be between 0 and 1
     * @returns {String} - HSL format
     */
    var heatMapColourValueBlue = function(value) {
        if (isNaN(value)) {
            return "hsl(0, 100%, 100%)";
        }
        return "hsl(240, 100%, " + parseInt(((1 - value) * 50) + 50) + "%)";
    };

    /**
     * Generate HSL heat map green colour based on value
     * @param value - number. Must be between 0 and 1
     * @returns {String} - HSL format
     */
    var heatMapColourValueGreen = function(value) {
        if (isNaN(value)) {
            return "hsl(0, 100%, 100%)";
        }
        return "hsl(120, 100%, " + parseInt(((1 - value) * 75) + 25) + "%)";
    };

    /**
     * Generate HSL heat map orange colour based on value
     * @param value - number. Must be between 0 and 1
     * @returns {String} - HSL format
     */
    var heatMapColourValueOrange = function(value) {
        if (isNaN(value)) {
            return "hsl(0, 100%, 100%)";
        }
        return "hsl(20, 100%, " + parseInt(((1 - value) * 50) + 50) + "%)";
    };

    /**
     * Get the highest LGA data value for data set
     * @param maxTotalData - number. Current highest value for data set
     * @param firstSet - boolean. Whether this is the first set of many
     * @param dataPointID - string. Data set name
     * @param setMaxData - number. Highest value for data set name dataPointID
     * @returns {number} - current highest value for data set
     */
    this.getDataMaximum = function(maxTotalData, firstSet, dataPointID, setMaxData) {
        var dataValue = myLGA.getDataPoint(dataPointID).getDataValue();

        if (isNaN(dataValue)) {
            dataValue = 0;
        } else if (dataValue === "") {
            dataValue = 0;
        }
        // Reset totalDataValue to 0 if going through first data set
        if (firstSet) {
            myLGA.addToTotalDataValue(-myLGA.getTotalDataValue());
        }

        if (isNaN(myLGA.getTotalDataValue())) {
            myLGA.setTotalDataValue(0);
        }
        myLGA.addToTotalDataValue(dataValue);

        // Make new maximum if found
        if (maxTotalData === 0) {
            maxTotalData = setMaxData;
        } else if (maxTotalData < myLGA.getTotalDataValue()) {
            maxTotalData = myLGA.getTotalDataValue();
        }
        return maxTotalData;
    };

    /**
     * Get LGA total data from data sets
     * @returns {Array[string - LGA name, number - LGA total data]}
     */
    this.getLgaTotal = function() {
        return [myLGA.getName(), myLGA.getTotalDataValue()];
    };

    /**
     * Remove data from LGA totalDataValue
     * @param dataPointIDstring - string. data set name
     */
    this.removeLgaDataSetFromTotal = function(dataPointIDstring) {
        myLGA.addToTotalDataValue(-myLGA.getDataPoint(dataPointIDstring).getDataValue());
    };

    /**
     * Add to the scene the display of data as a THREE.Mesh extruded according to the data value.
     * @param dataPointID - a data String ID
     * @param maxDataValue - value of the maximum of the data values in every LGA. (used for intensity coloring)
     * @param maxTotalData - number. Current highest value for data set
     * @param colour - string. Hexadecimal colour for mesh extrude
     * @param extrudeHeightMultiplier - float. Current extrude height for meshes
     * @param originalExtrudeHeight - float. Original extrude height for meshes
     */
    this.addDataDisplay = function(dataPointID, maxDataValue, maxTotalData, colour, extrudeHeightMultiplier, originalExtrudeHeight) {
        if (dataMeshes[dataPointID] == undefined) {  //If not existent

            // Take all the map meshes, clone, position and extrude them:

            // Get DataPointValue
            var dataValue = myLGA.getDataPoint(dataPointID).getDataValue();
            var zeroValue = false;

            if (isNaN(dataValue) || dataValue === "" || dataValue == 0) {
                dataValue = 0.1;
                zeroValue = true;
            }

            var heatMapPercentage = function() {
                return myLGA.getTotalDataValue() / maxTotalData;
            };

            var heatMapValue = heatMapPercentage();

            heatMapValue = heatMapColourValueRed(heatMapValue);

            //heatMapValue = hslToRgb(heatMapValue / 360, 1, 0.5);

            // can Mesh.clone() mesh or use mapGeometries or direct from d3threeD_meshes and add new material to create new Mesh.
            //mesh = mapMeshes.clone();

            var extrudeSettings = {
                amount: dataValue * extrudeHeightMultiplier,  // similar effect as mesh.scale.z
                material: 0,  // material index, 0-front, 1-side (, 2-back user generated)
                extrudeMaterial: 1,
                bevelEnabled: false,
                morphTargets: true
            };

            var shapes3d = new THREE.ExtrudeGeometry(d3threeD_meshes, extrudeSettings);

            var colorNumber = stringToNumber(dataPointID);

            //console.log("colorNumber = stringToNumber("+dataPointID+"); colorNumber % 0xffffff = "+ (colorNumber % 0xffffff));

            var materialSide = new THREE.MeshPhongMaterial({
                //color: (colorNumber % 0xffffff),  // color based on dataPointID string (dif color for dif data)
                // color based on dataValue per maximum.
                color: colour,
                transparent: true,
                opacity: 0.5
            });


            // materialFront: Start extrusion side & end extrusion side, outside face (inside extrusion mesh face if amount<0)
            // TODO: Fix this to work (materialFront color based on dataValue per maximum)
            var materialFrontColor = "LGAcolor";  // SET ME TO CHANGE COLOR/COLOUR SCHEME FOR EXTRUSIONS!!!
            if (materialFrontColor == "LGAcolor") {
                var materialFront = mapMeshes[0].material;  //Same material/color as map LGA color
                materialFront.color = new THREE.Color(heatMapValue);
            } else if (materialFrontColor == "dataValue") {
                //var materialFront = new THREE.MeshPhongMaterial({
                    // color based on dataValue per maximum. Log for colour differentiation
                    // - lowest 2 hex so doesn't overflow to other colours, +maxDataValue/5 so never full black
                    //color: Math.log10((1-(dataValue / (maxDataValue + maxDataValue/4)))*9+1) * 0x0000ff
                    //color: (1 - (dataValue / (maxDataValue + maxDataValue / 4))) * 0x0000ff
                    //color: "rgb(255, 0, 0)"
                    //transparent: true,
                    //opacity: 1
                    //,side: THREE.DoubleSide
                //});
                var materialFront = jQuery.extend(true, {}, mapMeshes[0].material);
                materialFront.color = new THREE.Color("rgb(" + heatMapValue[0] + ", " + heatMapValue[1] + ", " + heatMapValue[2] + ")");
                console.log(materialFront);
            }



            // (Back face of the extruded inside extrusion mesh face if amount<0, extruded side)
            var materialBack = mapMeshes[0].material;  // not used atm as below comment code doesn't work [materialBack8245]

            var materials = [materialFront, materialSide, materialBack];
            var faceMaterial = new THREE.MeshFaceMaterial(materials);

            var newDataMesh = new THREE.Mesh(shapes3d, faceMaterial);

            // Doesn't work if amount +ve, doesn't colour inside faces, clashes outside faces materials (doubly applied). [materialBack8245]
            // Set extruded back face (inside extrusion mesh if amount<0, extruded side) material to materialBack: z==1
            /*
            for ( var face in newDataMesh.geometry.faces ) {
                if (newDataMesh.geometry.faces.hasOwnProperty(face)) {
                    if (newDataMesh.geometry.faces[face].normal.z == 1) newDataMesh.geometry.faces[face].materialIndex = 2;
                    // there is no inside face unfortunately, doesn't work
                    if (newDataMesh.geometry.faces[face].normal.z == -1) newDataMesh.geometry.faces[face].materialIndex = 2;
                }
            }
            */

            // rotate and position the elements (Victoria) - to near the origin
            newDataMesh.rotation.x = rotateX ;  // Rotate first to avoid complications.
            newDataMesh.translateX(translateX);
            newDataMesh.translateY(translateY);

            // Translate dataValue height to pop out correct direction
            //newDataMesh.translateZ(translateZ);
            // height is negative
            newDataMesh.height = -dataValue * originalExtrudeHeight;
            //console.log("newDataMesh.height ="+newDataMesh.height);

            var scaleFactor = 1;
            if (extrudeHeightMultiplier != originalExtrudeHeight) scaleFactor = extrudeHeightMultiplier / originalExtrudeHeight;

            dataTranslateZ += newDataMesh.height;
            newDataMesh.translateZ(dataTranslateZ);
            newDataMesh.position.z *= scaleFactor;

            // Name newDataMesh toAdd to scene
            if (zeroValue) {
                dataValue = 0;
            }
            newDataMesh.name = name +": "+ dataPointID +" = "+dataValue;

            //console.log(newDataMesh.name+"'s height and position.z = "+newDataMesh.height+", "+newDataMesh.position.z);

            dataMeshes[dataPointID] = newDataMesh;
            threeRender.getScene().add(newDataMesh);

            //console.log("addDataDisplay for this new mesh:");
            //console.log(newDataMesh);

        } else {
            console.log("Warning: Tried to add existing mesh to LGAview.")
        }
    };

    /**
     * Update single LGA to appropriate face mesh colour
     * @param maxTotalData - number. Current highest value for data set
     */
    this.updateDataDisplayColour = function(maxTotalData) {
        var materialFront = mapMeshes[0].material;
        var heatMapPercentage = function() {
            return myLGA.getTotalDataValue() / maxTotalData;
        };

        var heatMapValue = heatMapPercentage();

        heatMapValue = heatMapColourValueRed(heatMapValue);

        var updateColour;
        if (maxTotalData === 0) {
            updateColour = new THREE.Color(((myLGA.getLGAid() - 20000) / 10000 * 0xffffff));
        } else {
            updateColour = new THREE.Color(heatMapValue);
        }

        materialFront.color = updateColour;
    };

    /**
     * Update selected LGAs to appropriate face mesh colour
     * @param maxTotalData - number. Current highest value for data set
     * @param selectLga - array. List of LGAs to be updated
     * @param removeLga - boolean. Whether the LGA is removed from graph
     */
    this.updateDataDisplayColourSelected = function(maxTotalData, selectLga, removeLga) {
        var index = selectLga.map(function(lga) { return lga.name;}).indexOf(myLGA.getName());
        if (index !== -1) {
            var materialFront = mapMeshes[0].material;
            var heatMapPercentage = function () {
                return myLGA.getTotalDataValue() / maxTotalData;
            };

            var heatMapValue = heatMapPercentage();

            if (removeLga) {
                heatMapValue = heatMapColourValueRed(heatMapValue);
            } else {
                heatMapValue = heatMapColourValueGreen(heatMapValue);
            }
            //heatMapValue = hslToRgb(heatMapValue / 360, 1, 0.5);

            var updateColour;
            if (maxTotalData === 0) {
                updateColour = new THREE.Color(((myLGA.getLGAid() - 20000) / 10000 * 0xffffff));
            } else {
                updateColour = new THREE.Color(heatMapValue);
            }

            materialFront.color = updateColour;

            // If LGA has 0 data value, make grey depending if added or not
            if (materialFront.color.r === 1 && materialFront.color.g === 1 && materialFront.color.b === 1 && !removeLga) {
                materialFront.color = new THREE.Color("hsl(0, 0%, 50%)");
            }
        }
    };

    /**
     * Update single LGA to appropriate face mesh colour
     * @param maxTotalData - number. Current highest value for data set
     * @param removeLga - boolean. Whether the LGA is removed from graph
     */
    this.updateSingleDataDisplayColourSelected = function(maxTotalData, removeLga) {
        var materialFront = mapMeshes[0].material;
        var heatMapPercentage = function () {
            return myLGA.getTotalDataValue() / maxTotalData;
        };

        var heatMapValue = heatMapPercentage();

        if (removeLga) {
            heatMapValue = heatMapColourValueRed(heatMapValue);
        } else {
            heatMapValue = heatMapColourValueGreen(heatMapValue);
        }
        //heatMapValue = hslToRgb(heatMapValue / 360, 1, 0.5);

        var updateColour;
        if (maxTotalData === 0) {
            updateColour = new THREE.Color(((myLGA.getLGAid() - 20000) / 10000 * 0xffffff));
        } else {
            updateColour = new THREE.Color(heatMapValue);
        }

        materialFront.color = updateColour;

        // If LGA has 0 data value, make grey depending if added or not
        if (materialFront.color.r === 1 && materialFront.color.g === 1 && materialFront.color.b === 1 && !removeLga) {
            materialFront.color = new THREE.Color("hsl(0, 0%, 50%)");
        }
    };

    /**
     * Remove LGA original colour property
     */
    this.deleteMaterialOriginalColor = function () {
        delete mapMeshes[0].material.originalColor;
    };

    /**
     * Update mesh face colour to yellow to when mouse hovering graph
     * @param original - boolean. Whether to update mesh face colour to its original colour
     */
    this.updateDataDisplayMouseover = function(original) {
        var materialFront = mapMeshes[0].material;
        if (!materialFront.originalColor) {
            materialFront.originalColor = materialFront.color;
        }
        if (original) {
            materialFront.color = materialFront.originalColor;
        } else {
            materialFront.color = new THREE.Color("hsl(54, 100%, 50%)"); //yellow
        }
    };

    /**
     * Clears display of all data in this LGAview object, makes it empty, removes them from scene
     */
    this.clearDataDisplay = function() {
        //console.log("dataMeshes:");
        //console.log(dataMeshes);
        // Remove all meshes from scene
        for (var dataMeshKey in dataMeshes) {
            if (dataMeshes.hasOwnProperty(dataMeshKey)) {
                //console.log("dataMeshes[dataMeshKey].name ="+dataMeshes[dataMeshKey].name+", dataMeshes[dataMeshKey]:");
                //console.log(dataMeshes[dataMeshKey]);
                var toRemove = threeRender.getScene().getObjectByName(dataMeshes[dataMeshKey].name);
                threeRender.getScene().remove(toRemove);
            }
        }

        // Remove from stored reference
        dataMeshes = {};
        // Clear dataTranslateZ variable
        dataTranslateZ = 0;

        // Responsibility of DataSelector, not LGAview to render.
        //threeRender.renderOnce();
    };

    /**
     * Remove the display of the individual data variable from scene.
     * @param dataPointIDstring - String
     */
    this.removeDataDisplay = function(dataPointIDstring) {
        // Check if dataMesh exists:
        if (dataMeshes[dataPointIDstring] == undefined) {
            return;
        }

        //console.log(this.getLGA().getName()+", dataTranslateZ before minus removedHeight: " + dataTranslateZ);

        // Update dataTranslateZ
        var removedHeight = dataMeshes[dataPointIDstring].height;
        dataTranslateZ -= removedHeight;
        var removedPosZ = dataMeshes[dataPointIDstring].position.z;

        // Remove from Scene
        var toRemove = threeRender.getScene().getObjectByName(dataMeshes[dataPointIDstring].name);
        threeRender.getScene().remove(toRemove);

        // delete from stored reference
        delete dataMeshes[dataPointIDstring];

        // Update all meshes in scene by dataTranslateZ
        for (var dataMeshKey in dataMeshes) {
            if (dataMeshes.hasOwnProperty(dataMeshKey)) {
                //console.log("dataTranslateZ ="+dataTranslateZ+", removedHeight="+removedHeight+", dataMeshes[dataMeshKey].position.z ="+dataMeshes[dataMeshKey].position.z+", dataMeshes[dataMeshKey]:");
                //console.log(dataMeshes[dataMeshKey]);

                // Only move down if dataMesh was above the removed data.
                var error = 0;  //1e-16, remember the '-' after e!

                /* COMMENT ME to uncomment the console.log!
                console.log("positionZ + error:"+(Math.abs(dataMeshes[dataMeshKey].position.z) + error)+" > removedPosZ:"+
                    Math.abs(removedPosZ)+" is " +( (Math.abs(dataMeshes[dataMeshKey].position.z) + error) > Math.abs(removedPosZ)) );
                // */

                if ( (Math.abs(dataMeshes[dataMeshKey].position.z) + error) > Math.abs(removedPosZ)) {  //heights are negative, positions positive
                threeRender.getScene().getObjectByName(dataMeshes[dataMeshKey].name).translateZ(-removedHeight);
            }
                //console.log(dataMeshes[dataMeshKey]);
                //console.log("dataMeshes[dataMeshKey].position.z ="+dataMeshes[dataMeshKey].position.z);
            }
        }


        // Responsibility of DataSelector, not LGAview to render.
        //threeRender.renderOnce();
    };

    /**
     * Return Lga object that this LGAview object is observing and representing/visualising
     * @returns {*}
     */
    this.getLGA = function() {
        return myLGA;
    };

    this.getDataMeshes = function() {
        return dataMeshes;
    };

};

/**
 * Make a THREE.js scene, camera, and renderer that can be used to renderer.render(scene, camera)
 * @constructor
 */
var ThreeRender = function(app, appDOMelement) {  // appDOMelement for SAGE2
    // Scene
    var scene = new THREE.Scene();

    // Camera
    var camera;
    var addCamera = function() {
        var aspectRatio = app.mapWidthRatio * appDOMelement.clientWidth / appDOMelement.clientHeight;
        var cameraSettings = {
            left: appDOMelement.clientWidth / -2,
            right: appDOMelement.clientWidth / 2,
            top: appDOMelement.clientHeight / 2,
            bottom: appDOMelement.clientHeight / -2,
            near: 0.001,
            far: 10000,
            fov: 60,
            aspect: aspectRatio,//8.8888,//appDOMelement.clientWidth / appDOMelement.clientHeight,  //TODO: Fix this hardcoded for CAVE2 (20x4 screens, each 16:9, 80:9=8.888), TRIO=5.333
            x: 0,
            y: 0,
            z: 20,
            lx: 0,
            ly: 0,
            lz: 0
        };

        // Use OrthographicCamera for easy comparison of heights in 3D from any perspective (as opposed to PerspectiveCamera)
        //camera = new THREE.OrthographicCamera(cameraSettings.left, cameraSettings.right,
        //    cameraSettings.top, cameraSettings.bottom, cameraSettings.near, cameraSettings.far);
        // Try Perspective Camera for trackball controls compatibility
        camera = new THREE.PerspectiveCamera(cameraSettings.fov, cameraSettings.aspect, cameraSettings.near, cameraSettings.far);
        camera.position.x = cameraSettings.x;
        camera.position.y = cameraSettings.y;
        camera.position.z = cameraSettings.z;
        //(510, 100, 250, 510, 120);  //x,y,z,lx,lz; x and lx always same  //default 0, 1000, 500, 0,0,0
        camera.lookAt({x: cameraSettings.lx, y: cameraSettings.ly, z: cameraSettings.lz});
    }();


    // Lights
    var addPointLight = function(x, y, z) {
        var lightSettings = {
            hex: 0xffffff,
            intensity: 0.8,
            distance: 0,
            x: x,
            y: y,
            z: z
        };
        var pointLight = new THREE.PointLight(lightSettings.hex, lightSettings.intensity, lightSettings.distance);
        pointLight.position.x = lightSettings.x;
        pointLight.position.y = lightSettings.y;
        pointLight.position.z = lightSettings.z;

        scene.add(pointLight);
        return pointLight
    };
    var pointLight1 = addPointLight(0, 30, 300);
    var pointLight2 = addPointLight(0, 30, -300);
    var pointLight3 = addPointLight(30, 300, 0);
    var pointLight4 = addPointLight(30, -300, 0);
    var pointLight5 = addPointLight(300, 30, 0);
    var pointLight6 = addPointLight(-300, 30, 0);

    //var ambientLight = new THREE.AmbientLight( 0xF0F0F0 ); // soft white light 404040
    //scene.add( ambientLight );


    // Renderer
    var renderer = new THREE.WebGLRenderer({
        antialias : true
    });
    renderer.setSize( app.mapWidthRatio * appDOMelement.clientWidth, appDOMelement.clientHeight);
    //renderer.render(); // render once for updating it at start

    var myRender = function() {
        renderer.render(scene, camera);
        //console.log("I'm rendering! scene:");
        //console.log(scene);
    };


    // NOTE: SAGE2 extra appDOMelement from SAGE2 app (this)
    // Controls for camera
    var camControls = new THREE.OrbitControls( camera , appDOMelement); //appDOMelement for SAGE2

    camControls.autoRotateSpeed = 10.0;
    camControls.zoomSpeed = 1.2;
    camControls.keyPanSpeed = 80;

    camControls.noZoom = false;
    camControls.noPan = false;

    camControls.staticMoving = true;
    camControls.dynamicDampingFactor = 0.3;

    camControls.keys = [ 65, 83, 68 ];

    camControls.addEventListener( 'change', myRender );


    // Other stuff
    console.log("Inside ThreeRender, after adding pointLight to scene. this:");
    console.log(this);

    // Axis object
    //var axisHelper = new THREE.AxisHelper( 300 );
    //scene.add( axisHelper );

    // Raycaster
    var raycaster = new THREE.Raycaster();

    // AnimationFrames - call renderer.render(scene, camera)
    var animationFrameID; var oldValues;
    var animate = function(app) {
        //console.log("var render(): scene, camera:");  // I get undefined, but animation frame runs
        //console.log(scene);
        //console.log(camera);

        //animationFrameID = requestAnimationFrame(animate);  //moved to document tick

        // Update scene and scene children here:

        // find intersections
        raycaster.setFromCamera( app.mouse, camera );
        /* TODO: Must change to be more accurate (map being sensed seems offset right by some amount,
                              and up/down by height of text div), maybe try substitute app.element.height:
                  Also, when scrolled up and left completely, and canvas also top left of page, it's accurate.
         */
/*
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        this.projector.unprojectVector( vector, this.camera );
        var raycaster = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );
        var intersects = raycaster.intersectObjects( this.scene.children );
*/
        var resetIntersected = function () {
            if ( app.INTERSECTED && app.INTERSECTED.material && app.INTERSECTED.material.materials && oldValues) {  //make sure things are defined
                app.INTERSECTED.material.materials[1].color.setHex(oldValues.color);
                app.INTERSECTED.material.materials[1].setValues(oldValues);

                //myRender();
            }
            app.INTERSECTED = null;
        };

        var intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0 ) {
            if (app.positionX < app.mapWidthRatio * app.element.clientWidth) {
                if (app.INTERSECTED != intersects[0].object) {  // if var INTERSECTED not already currently top mouse-overed obj
                    // Reset previously INTERSECTED attribs:

                    //console.log("intersects[0].object then INTERSECTED, then INTERSECTED.material.materials[1] after assigning to [0].object and change color/opacity");
                    //console.log(intersects[0].object);
                    //console.log(INTERSECTED);

                    //INTERSECTED.material == MeshFaceMaterial; INTERSECTED.material.materials == [materialFront, materialSide, materialBack];

                    if (app.INTERSECTED && app.INTERSECTED.material && app.INTERSECTED.material.materials && oldValues) {  //make sure things are defined
                        app.INTERSECTED.material.materials[1].setValues(oldValues);
                    }

                    // Update new INTERSECTED obj with new mouse-overed color
                    app.INTERSECTED = intersects[0].object;

                    if (app.INTERSECTED && app.INTERSECTED.material && app.INTERSECTED.material.materials) {
                        //store previous values if it has 3 materials so we can put them back later
                        oldValues = {
                            opacity: app.INTERSECTED.material.materials[1].opacity
                            , color: app.INTERSECTED.material.materials[1].color.getHex()
                        };

                        var newValues = {
                            opacity: 1.0
                        };

                        app.INTERSECTED.material.materials[1].setValues(newValues);
                        app.INTERSECTED.material.materials[1].color.setHex(0xff00ff);
                        //INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                        //INTERSECTED.material.emissive.setHex( 0xff0000 );

                        //console.log(INTERSECTED.material.materials[1]);
                        //myRender();
                    }
                }
            } else {
                resetIntersected();
            }
        } else {  //mouse now over nothing
            resetIntersected();
        }

        camControls.update();
        //renderer.render(scene, camera);  // not needed if using controls.update(); which on change, calls render.

        //cancelAnimationFrame(animationFrameID);

    };



    /**
     * Run this to start the rendering process, it no longer continues to animate via requestAnimationFram(render),
     * as update functionality moved into document tick so mouse-over ray-tracing can work.
     * This is a publicly accessible method to call private animate method (which requestAnimationFrame needs to be private)
     */
    this.startRender = function() {
        //console.log("this.startRender(): this:");  // I get a ThreeRender object.
        //console.log(this);

        animate(app);
    };

    /**
     * * Return THREE.Renderer object (WebGL)
     * @returns {THREE.WebGLRenderer}
     */
    this.getRendererDOMelement = function() {
        return renderer.domElement;
    };

    /**
     * Call renderer.render once
     */
    this.renderOnce = function() {
        myRender();
    };

    /**
     *
     * @returns {THREE.PerspectiveCamera}
     */
    this.getCamera = function() {
        return camera;
    };

    /**
     *
     * @returns {THREE.Vector3}
     */
    this.getCameraPosition = function() {
        return camera.position;
    };

    /**
     *
     * @returns {float}
     */
    this.getCameraPositionX = function() {
        return camera.position.x;
    };

    /**
     *
     * @returns {float}
     */
    this.getCameraPositionY = function() {
        return camera.position.y;
    };

    /**
     *
     * @returns {float}
     */
    this.getCameraPositionZ = function() {
        return camera.position.z;
    };

    /**
     * Set camera's position
     * @param x
     * @param y
     * @param z
     */
    this.setCameraPosition = function(x, y, z) {
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;
    };

    /**
     *
     * @returns {THREE.Scene}
     */
    this.getScene = function() {
        return scene;
    };

    /**
     *
     * @returns {THREE.TrackballControls}
     */
    this.getCamControls = function(){
        return camControls;
    };

    /**
     * Set the renderer size to width, height
     * @param width
     * @param height
     */
    this.setRendererSize = function(width, height) {
        renderer.setSize( width, height );
        camera.aspect = width / height;
        //camera.setViewOffset(width, height, 0, 0, width, height);  //doesn't have effect on SAGE2 with 1 screen   // KILLS right side rotation on webapp TODO: investigate

        camera.updateProjectionMatrix();
        //console.log("ThreeRender.setRendererSize() called, now after camera.updateProjectionMatrix()!");

        //renderOnce
        myRender();
    };

    /**
     * Call renderer.clear() on the renderer.
     */
    this.clearRenderer = function() {
        renderer.clear();
    }

};



// Controller Module ----------------------------------------------------------------------------------

// DataLoader
/**
 * Create a DataLoader that holds references to an array of LGA classes.
 * @constructor
 */
var DataLoader = function() {
    var lgasArray = [];
    var lgasObject = {};

    /**
     * Loads data from PapaParsed CSV file into the DataLoader's lgas array.
     * @param data - format is that of PapaParser.result.data
     */
    this.loadData = function(data) {
        for (var i=0; i<data.length; i++) {
            var newLGA = new Lga(data[i].LGA_id, data[i].LGA_name);  // from CSV file headings

            // Create DataPoints and attach to LGA
            for (var dataProp in data[i]) {
                if (data[i].hasOwnProperty(dataProp)){
                    //if (dataProp.search("SH_") >= 0) {  // Search for self-harm data indicated by leading "SH_" only
                        var newDataPt = new DataPoint(dataProp.toString(), data[i][dataProp]);
                        newLGA.addDataPoint(newDataPt);
                    //}
                }
            }
            // Push the newLGA onto DataLoader's lgas array.
            lgasArray.push(newLGA);
            lgasObject[newLGA.getLGAid()] = newLGA;
        }
    };

    /**
     * Get LGA array
     * @returns {Array}
     */
    this.getLGAsArray = function() {
        return lgasArray;
    };

    /**
     * Get the LGAs object with keys of LGA_id e.g. 20110, and values of Lga objects
     * @returns {{}}
     */
    this.getLGAsObject = function() {
        return lgasObject;
    };

    /**
     * Get LGA object with key of LGA_id e.g. 20110
     */
    this.getLGAobject = function(lgaID) {
        return lgasObject[lgaID];
    };

    /**
     * Get the maximum value of a dataPoint across all LGAs
     * @param dataPointIDstring - stringID of data to show
     * @returns {number}
     */
    this.getMaximum = function(dataPointIDstring) {
        var max = 0;
        //console.log(lgasArray);
        for (var i=0; i<lgasArray.length; i++) {
            //console.log("i="+i+", dataPointIDstring="+dataPointIDstring);
            //console.log(lgasArray[i]);
            //console.log(lgasArray[i].getDataPoint(dataPointIDstring));
            if ( max < lgasArray[i].getDataPoint(dataPointIDstring).getDataValue() ) {
                max = lgasArray[i].getDataPoint(dataPointIDstring).getDataValue();
            }
        }
        return max;
    };


};


/**
 * Create a MapLoader that creates LGAviews, and links them with Lga objects in the dataLoader
 * @param jsonData - data from the $.getJSON() function
 * @param dataLoader - dataLoader that has references to the corresponding Lga objects.
 * @param threeRender - threeRender object to give to LGAview objects to reference for adding scene objects
 * @constructor
 */
var MapLoader = function(jsonData, dataLoader, threeRender) {
    var lgaViews = {};

    // add_lga code from worldMap-demo
    var d3threeD_meshes = [];
    var d3threeD_meshesObj = {};

    var initialise = function() {
        // convert to threejs meshes
        for (var i = 0; i < jsonData.features.length; i++) {
            var geoFeature = jsonData.features[i];
            var properties = geoFeature.properties;

            // From init_d3:
            var geoConfig = function () {

                this.mercator = d3.geo.equirectangular();
                this.path = d3.geo.path().projection(this.mercator);

                var translate = this.mercator.translate();
                translate[0] = 500;
                translate[1] = 0;

                this.mercator.translate(translate);
                this.mercator.scale(200);
            };
            var this_geo = new geoConfig();
            // end from init_d3

            var feature = this_geo.path(geoFeature);

            // we only need to convert it to a three.js path
            var d3threeD_mesh = transformSVGPathExposed(feature);  // returns an array of objects (MultiPolygon means >1 obj)

            // add to array
            for (var j = 0; j < d3threeD_mesh.length; j++) {
                d3threeD_meshes.push({"data": properties, "mesh": d3threeD_mesh[j]});
                if (d3threeD_meshesObj[properties.LGA_ID] == undefined) {  // LGA_ID from GeoJSON data (.shp files originally)
                    d3threeD_meshesObj[properties.LGA_ID] = {
                        data: properties,
                        mesh: []
                    };
                }
                d3threeD_meshesObj[properties.LGA_ID].mesh.push(d3threeD_mesh[j]);
            }
        }

        console.log('d3threeD_meshesObj and d3threeD_meshesObj["20110"] coming up:');
        //console.log(d3threeD_meshesObj);
        console.log(d3threeD_meshesObj["20110"]);


        // Add an LGAview object for each LGA from the GeoJSON
        for (var keyLGAid in d3threeD_meshesObj) {
            if (d3threeD_meshesObj.hasOwnProperty(keyLGAid)) {
                // Sanity check
                if (keyLGAid != d3threeD_meshesObj[keyLGAid].data.LGA_ID) {
                    console.log("Warning, keyLGAid doesn't match d3threeD_meshesObj[keyLGAid].data.LGA_ID.\nkeyLGAid: " + keyLGAid + ", d3threeD_meshesObj[keyLGAid]:");
                    console.log(d3threeD_meshesObj[keyLGAid]);
                }
                lgaViews[keyLGAid] = new LGAview(dataLoader.getLGAobject(keyLGAid), d3threeD_meshesObj[keyLGAid].mesh, threeRender);
            }
        }

    }();  // END Constructor stuff to do.



    /**
     * Get LGAviews object containing all created LGAviews, key value LGA_id e.g. 20110
     */
    this.getLGAviews = function() {
        return lgaViews;
    };

    /**
     * Get LGAview with key of LGA_id e.g. 20110
     */
    this.getLGAviewObj = function(lgaID) {
        return lgaViews[lgaID];
    };

    /**
     * Get d3threeD_meshesObj object
     */
    this.d3meshesObj = function() {
        return d3threeD_meshesObj;
    };

    /**
     * dataLoader of the mapLoader (given to mapLoader during construction)
     * @returns {*}
     */
    this.getDataLoader = function() {
        return dataLoader;
    };

};


/**
 * A class for selecting which data to display.
 * Responsible for calling render after scene data updates from LGAview objects.
 * @param mapLoader - the MapLoader object with all the LGAview object references
 * @param threeRender - The ThreeRender object that will render the LGAview objects.
 * @constructor
 */
var DataSelector = function(mapLoader, threeRender) {
    var lgaViews = mapLoader.getLGAviews();

    /**
     * Get highest total value for data set
     * @param selectDataSet - array. List of data sets selected
     * @returns {number} - Highest total value for data set
     */
    var getDataSetMaxData = function(selectDataSet) {
        var maxTotalData = 0, firstSet = true;
        for (var i = 0; i < selectDataSet.length; i++) {
            for (var keyLGAid in lgaViews) {
                if (lgaViews.hasOwnProperty(keyLGAid)) {
                    // Get current maximum total data value
                    maxTotalData = mapLoader.getLGAviews()[keyLGAid].getDataMaximum(maxTotalData, firstSet, selectDataSet[i], mapLoader.getDataLoader().getMaximum(selectDataSet[i]));
                }
            }
            firstSet = false;
        }
        return maxTotalData;
    };

    /**
     * Get array containing all LGAs with total value sorted from highest to lowest
     * @returns {Array}
     */
    var getTopLgas = function () {
        var lgaTotalsArray = [], lgaTotalObject, currentLgaTotal;
        for (var keyLGAid in lgaViews) {
            lgaTotalObject = {};
            currentLgaTotal = mapLoader.getLGAviews()[keyLGAid].getLgaTotal();
            lgaTotalObject.id = keyLGAid;
            lgaTotalObject.name = currentLgaTotal[0];
            //lgaTotalObject.total = Math.round(currentLgaTotal[1] * 100 / 100);
            lgaTotalObject.total = currentLgaTotal[1].toFixed(2);
            lgaTotalsArray.push(lgaTotalObject);
        }

        lgaTotalsArray.sort(function(a, b) { if (a === "") a = 0; if (b === "") b = 0; return b.total - a.total; });
        return lgaTotalsArray;
    };

    /**
     * Slices array based on value topNumber, returning a "top" array sorted
     * @param lgas - array. Contains LGAs with their totals
     * @param topNumber - integer. Number of LGAs to be returned
     * @returns {Array}
     */
    var getLgaTopName = function(lgas, topNumber) {
        var lgaTopName = [];
        for (var i = 0; i < topNumber; i++) {
            lgaTopName.push({
                id: lgas[i].id,
                name: lgas[i].name,
                total: lgas[i].total});
        }
        return lgaTopName;
    };

    /**
     * Get LGA object with id, name and total
     * @param lga - string. Name of LGA
     * @returns {{id: string, name: string, total: number}} - Object
     */
    this.getLgaTotalData = function(lga) {
        var currentLga;
        for (var keyLGAid in lgaViews) {
            if (lgaViews.hasOwnProperty(keyLGAid)) {
                currentLga = mapLoader.getLGAviews()[keyLGAid].getLgaTotal();
                if (currentLga[0] === lga) {
                    return {id: keyLGAid, name: currentLga[0], total: currentLga[1]};
                }
            }
        }
    };

    /**
     * Update all LGAs face mesh colour for selected data set and LGAs
     * @param selectDataSet - array. List of data sets selected
     * @param selectLga - array. List of LGAs to be updated
     */
    this.updateDataColourSelected = function(selectDataSet, selectLga) {

        var maxTotalData = getDataSetMaxData(selectDataSet);

        for (var keyLGAid in lgaViews) {
            if (lgaViews.hasOwnProperty(keyLGAid)) {
                mapLoader.getLGAviews()[keyLGAid].deleteMaterialOriginalColor();
                mapLoader.getLGAviews()[keyLGAid].updateDataDisplayColourSelected(maxTotalData, selectLga);
            }
        }
        //threeRender.renderOnce();
    };

    /**
     * Update single LGA fash mesh colour
     * @param selectDataSet - array. List of data sets selected
     * @param selectLga - array. List of LGAs to be updated
     * @param removeLga - boolean. Whether the LGA is removed from graph
     */
    this.updateSingleDataColourSelected = function(selectDataSet, selectLga, removeLga) {

        var maxTotalData = getDataSetMaxData(selectDataSet);

        mapLoader.getLGAviews()[selectLga.id].deleteMaterialOriginalColor();
        mapLoader.getLGAviews()[selectLga.id].updateSingleDataDisplayColourSelected(maxTotalData, removeLga);
    };

    /**
     * Get array sorted LGAs with totals of length topNumber
     * @param topNumber - integer. Number of LGAs to be returned
     * @returns {Array}
     */
    this.getTopNumberLga = function(topNumber) {
        var allLgas = getTopLgas();
        return getLgaTopName(allLgas, topNumber);
    };

    /**
     * Update mesh face colour based on mouse hovering graph
     * @param keyLGAid - string. LGA id
     * @param original - boolean. Whether to update mesh face colour to its original colour
     */
    this.updateDataMouseover = function(keyLGAid, original) {
        mapLoader.getLGAviews()[keyLGAid].updateDataDisplayMouseover(original);
    };

    /**
     * Update mesh face colour based on mouse hovering map
     * @param lgaId - string. LGA id
     * @param originalColour - boolean. Whether to update mesh face colour to its original colour
     */
    this.updateMapMouseover = function(lgaId, originalColour) {
        if (!originalColour) {
            if (mapLoader.getLGAviews()[lgaId] != null)
            mapLoader.getLGAviews()[lgaId].updateDataDisplayMouseover();
        } else {
            if (mapLoader.getLGAviews()[lgaId] != null)
            mapLoader.getLGAviews()[lgaId].updateDataDisplayMouseover(true);
        }
    };

    /**
     * Add data to All LGAviews in the mapLoader
     * @param dataPointIDstring - stringID of data to show
     * @param selectDataSet - array. List of data sets selected
     * @param colour - string. Hexadecimal colour for mesh extrude
     * @param extrudeHeightMultiplier - float. Current extrude height for meshes
     * @param originalExtrudeHeight - float. Original extrude height for meshes
     * @param noLGAs - integer. No. of LGAs to highlight on map and show on graph
     */
    this.addDataToAll = function(dataPointIDstring, selectDataSet, colour, extrudeHeightMultiplier, originalExtrudeHeight, noLGAs) {

        var maxTotalData = getDataSetMaxData(selectDataSet);
        var allLgas = getTopLgas();
        var lgaTopName = getLgaTopName(allLgas, noLGAs);

        for (var keyLGAid in lgaViews) {
            if (lgaViews.hasOwnProperty(keyLGAid)) {
                mapLoader.getLGAviews()[keyLGAid].deleteMaterialOriginalColor();
                mapLoader.getLGAviews()[keyLGAid].addDataDisplay(dataPointIDstring, mapLoader.getDataLoader().getMaximum(dataPointIDstring), maxTotalData, colour, extrudeHeightMultiplier, originalExtrudeHeight);
            }
        }

        //threeRender.renderOnce();
        return lgaTopName;
    };

    /**
     * Add data to only one LGAview in the mapLoader
     * @param lgaID - the LGA ID code like 20110
     * @param dataPointIDstring - stringID of data to show
     */
    this.addDataToOne = function(lgaID, dataPointIDstring) {
        mapLoader.getLGAviewObj(lgaID).addDataDisplay(dataPointIDstring, mapLoader.getDataLoader().getMaximum(dataPointIDstring));
        threeRender.renderOnce();
    };

    /**
     * Clear all data displays for all LGAviews in mapLoader.
     */
    this.clearData = function() {
        for (var keyLGAid in lgaViews) {
            if (lgaViews.hasOwnProperty(keyLGAid)) {
                mapLoader.getLGAviews()[keyLGAid].clearDataDisplay();
            }
        }
        //threeRender.renderOnce();
    };

    /**
     * Remove a single variable from display
     * @param dataPointIDstring
     * @param selectDataSet - array. List of data sets selected
     * @param noLGAs - integer. No. of LGAs to highlight on map and show on graph
     */
    this.removeDataVariable = function(dataPointIDstring, selectDataSet, noLGAs) {
        for (var keyLGAid in lgaViews) {
            mapLoader.getLGAviews()[keyLGAid].removeLgaDataSetFromTotal(dataPointIDstring);
        }
        var maxTotalData = getDataSetMaxData(selectDataSet);
        var allLgas = getTopLgas();
        var lgaTopName = getLgaTopName(allLgas, noLGAs);


        for (var keyLGAid in lgaViews) {
            if (lgaViews.hasOwnProperty(keyLGAid)) {
                mapLoader.getLGAviews()[keyLGAid].removeDataDisplay(dataPointIDstring);
                // Update mesh colours
                mapLoader.getLGAviews()[keyLGAid].deleteMaterialOriginalColor();
                mapLoader.getLGAviews()[keyLGAid].updateDataDisplayColour(maxTotalData);
            }
        }
        //threeRender.renderOnce();
        return lgaTopName;
    };

    /**
     * Retrieve the data point ID strings (data variables) for all LGA objects (currently does the 1st in the LGA array)
     * @returns {Array}
     */
    this.getDataPointIDstrings = function() {
        return mapLoader.getDataLoader().getLGAsArray()[0].getDataPointIDs();
    };


};
function map3d_init(app, appdata){  // for SAGE2

    /**
     * Create map meshes from csv data
     * @param app - SAGE2 app
     * @param dataCsv - string. Csv file name
     * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
     */
    function csvToMap(app, dataCsv, dataCsvStore) {
        $.getJSON(app.resrcPath + "data/VIC_map_region_s0.001.json", function (data) {  //app.resrcPath+ for SAGE2
            var threeRender = new ThreeRender(app, app.element);  // app.element for SAGE2
            var mapLoader = new MapLoader(data, dataCsvStore[dataCsv]['dataLoader'], threeRender);
            var dataSelector = new DataSelector(mapLoader, threeRender);
            dataCsvStore[dataCsv]['threeRender'] = threeRender;
            dataCsvStore[dataCsv]['mapLoader'] = mapLoader;
            dataCsvStore[dataCsv]['dataSelector'] = dataSelector;
        })
    }

    /**
     * Parse csv file
     * @param app - SAGE2 app
     * @param dataCsv - string. Csv file name
     * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
     */
    function parseCsv(app, dataCsv, dataCsvStore) {
        $.get(app.resrcPath + 'data/' + dataCsv, function (data) {  // app.resrcPath+ for SAGE2
            Papa.parse(data, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,  // fixes undefined errors that happen when parsing empty lines
                complete: function (results) {
                    var result1 = results;  //includes { data: array, errors: array, meta: object }
                    var data1 = result1.data;
                    var dataLoader = new DataLoader();
                    dataLoader.loadData(data1);
                    dataCsvStore[dataCsv]['data'] = data1;
                    dataCsvStore[dataCsv]['dataLoader'] = dataLoader;
                    csvToMap(app, dataCsv, dataCsvStore);
                }
            })
        })
    }

    /**
     * Create HTML element UL
     * @param parent - HTML element. Parent of UL
     * @param flexDisplay - boolean. Whether to add flex display attributes
     * @returns {Element}
     */
    var create_menu_ul = function (parent, flexDisplay) {
        var ul = document.createElement('ul');
        ul.style.listStyleType = "none";
        if (flexDisplay) {
            ul.style.height = "inherit";
            ul.style.display = "flex";
            ul.style.flexDirection = "column";
            ul.style.justifyContent = "space-around";
        }
        parent.appendChild(ul);
        return ul;
    };

    /**
     * Create HTML element LI
     * @param menuIndex - integer. Menu item's index
     * @param item - string. Name of menu item
     * @param menuSize - integer. Number of total menu items
     * @param appID - string. Unique SAGE2 app ID
     * @param ulElement - HTML UL element to place LI
     * @param menuSelected - Object. Track what menu items are selected
     * @param padding - string. List left padding
     */
    var create_menu_li = function (menuIndex, item, menuSize, appID, ulElement, menuSelected, padding) {
        var varText = item;
        var li = document.createElement("li");
        var text = document.createTextNode(varText);
        li.appendChild(text);
        li.style.paddingLeft = padding;
        //li.style.height = 100 / menuSize + "%";
        //li.style.listStyleType = "disc";
        //li.style.display = "list-item";
        li.id = varText + appID;
        ulElement.appendChild(li);
        menuSelected[varText + appID] = [menuIndex[0], false, "green"];
    };

    /**
     * Parse and create map data for initial csv
     * @param app - SAGE2 app
     * @param dataCsv - string. Csv file name
     * @param dataCsvStore - Object. Has CSV classes: data, dataLoader, threeRender, mapLoader and dataSelector
     */
    function loadCsv(app, dataCsv, dataCsvStore) {
        app.mouse = new THREE.Vector2();
        app.INTERSECTED;
        // Get CSV data and parse it, loading it into model using dataLoader1
        $.when($.get(app.csvPath, function (data) {  // app.resrcPath+ for SAGE2
                Papa.parse(data, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,  // fixes undefined errors that happen when parsing empty lines
                    complete: function (results) {
                        var result1 = results;  //includes { data: array, errors: array, meta: object }
                        app.data1 = result1.data;
                        //console.log(">>Direct data from CSV parser:");
                        //console.log(result1);
                        //console.log(result1.data[0]);
                        //console.log(app.data1);
                        //console.log(app.data1[0]);
                        //console.log(app.data1[0].LGA_id);

                        // Put datainto the model:
                        app.dataLoader1 = new DataLoader();
                        app.dataLoader1.loadData(app.data1);

                        dataCsvStore[dataCsv]["data"] = app.data1;
                        dataCsvStore[dataCsv]["dataLoader"] = app.dataLoader1;

                        app.lgasId = {};
                        // Keep track of LGA mouse over
                        app.lgasHighlighted = {};
                        for (var i = 0; i < app.data1.length; i++) {
                            app.lgasId[app.data1[i].LGA_name] = app.data1[i].LGA_id;
                            app.lgasHighlighted[app.data1[i].LGA_name] = false;
                        }

                    }
                });
            })
        ).then(  //after get CSV


            // From init()
            // "data/countries.json" vs "examples/worldMap-d3-3js/data/LGA_POLYGON_s0.001_crs84.json"
            //    vs "data/VIC_map_region_s0.001.json" - doesn't work with mouse-over names or colours
            $.when($.getJSON(app.resrcPath + "data/VIC_map_region_s0.001.json")).then(function (data) {  //app.resrcPath+ for SAGE2

                app.threeRender1 = new ThreeRender(app, app.element);  // app.element for SAGE2
                app.mainRenderer = app.threeRender1;


                app.mapLoader1 = new MapLoader(data, app.dataLoader1, app.threeRender1);

                app.element.appendChild(app.threeRender1.getRendererDOMelement());  //divContainer

                app.dataSelector1 = new DataSelector(app.mapLoader1, app.threeRender1);
                app.threeRender1.renderOnce();

                dataCsvStore[dataCsv]["threeRender"] = app.threeRender1;
                dataCsvStore[dataCsv]["mapLoader"] = app.mapLoader1;
                dataCsvStore[dataCsv]["dataSelector"] = app.dataSelector1;


                // Populate add data droplist at start:
                var dataVariables = app.dataSelector1.getDataPointIDstrings();

                // Remove data variables
                var index = dataVariables.indexOf("LGA_id");
                dataVariables.splice(index, 1);
                index = dataVariables.indexOf("LGA_name");
                dataVariables.splice(index, 1);

                app.dataSetColours = {};
                //var colourPalette = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];
                //var colourPalette = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
                //var colourPalette = ["#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
                //    "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
                //    "#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
                //    "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
                //    "#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
                //    "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
                //    "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
                //    "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
                //    "#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
                //    "#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
                //    "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
                //    "#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
                //    "#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C"];

                //var colourPalette = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd",
                //                     "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d",
                //                     "#17becf", "#9edae5"];
                // Same colours as above but shuffled
                var colourPalette = ["#bcbd22", "#9467bd", "#17becf", "#ff7f0e", "#98df8a", "#1f77b4", "#dbdb8d", "#aec7e8", "#c5b0d5",
                    "#ff9896", "#2ca02c", "#f7b6d2", "#8c564b", "#9edae5", "#d62728", "#7f7f7f", "#ffbb78", "#c49c94",
                    "#c7c7c7", "#e377c2"];

                //function shuffle(array) {
                //    var currentIndex = array.length, temporaryValue, randomIndex;
                //
                //    // While there remain elements to shuffle...
                //    while (0 !== currentIndex) {
                //
                //        // Pick a remaining element...
                //        randomIndex = Math.floor(Math.random() * currentIndex);
                //        currentIndex -= 1;
                //
                //        // And swap it with the current element.
                //        temporaryValue = array[currentIndex];
                //        array[currentIndex] = array[randomIndex];
                //        array[randomIndex] = temporaryValue;
                //    }
                //
                //    return array;
                //}
                //shuffle(colourPalette);
                //console.log(colourPalette);

                /**
                 * Place initial child data into its parent data as a array. Data with no parents are placed
                 * in property "NoParent"
                 * @param groupedData - object. Contains data names
                 * @param parent - string. Name of parent
                 * @param data - string. Name of child
                 */
                var data_to_parent_array = function (groupedData, parent, data) {
                    if (groupedData.hasOwnProperty(parent)) {
                        groupedData[parent].push(data);
                    } else {
                        groupedData[parent] = [data];
                    }
                };

                var removeUnderscore = function(variableName) {
                    var underscoreRemovedVariableName = "";
                    for (var i = 0; i < variableName.length; i++) {
                        if (variableName[i] == "_") {
                            underscoreRemovedVariableName += " ";
                        } else {
                            underscoreRemovedVariableName += variableName[i];
                        }
                    }
                    return underscoreRemovedVariableName;
                };

                // Group data into initial groups and set colours for each one
                var tempGroupedData = {};
                for (var i = 0; i < dataVariables.length; i++) {
                    if (i < 6) {
                        data_to_parent_array(tempGroupedData, "Mammals", dataVariables[i]);
                    } else if (i >= 6 && i < 11) {
                        data_to_parent_array(tempGroupedData, "Reptiles", dataVariables[i]);
                    } else if (i >= 11 && i < 18) {
                        data_to_parent_array(tempGroupedData, "Birds", dataVariables[i]);
                    } else if (i >= 18 && i < 22) {
                        data_to_parent_array(tempGroupedData, "Insects", dataVariables[i]);
                    } else {
                        data_to_parent_array(tempGroupedData, "NoParent", dataVariables[i]);
                    }
                    app.dataSetColours[dataVariables[i]] = colourPalette[i % colourPalette.length];
                }


                /**
                 * Place parent data into another parent data as an object. Data with no parents are
                 * placed in property "NoParent"
                 * @param groupedData - object. Contains parent data names.
                 * @param parent - string. Name of parent
                 * @param data - object. Data sets with parents as property.
                 * @param child - string. Name of child.
                 */
                var data_to_parent = function (groupedData, parent, data, child) {
                    if (parent !== "NoParent") {
                        if (groupedData.hasOwnProperty(parent)) {
                            groupedData[parent][child] = data[child];
                        } else {
                            var tempObject = {};
                            tempObject[child] = data[child];
                            groupedData[parent] = tempObject;
                        }
                    } else {
                        groupedData[parent] = data[parent];
                    }
                };

                // Group data variables into parents
                app.groupedDataVariables = {};
                data_to_parent(app.groupedDataVariables, "Group A", tempGroupedData, "Mammals");
                data_to_parent(app.groupedDataVariables, "Group A", tempGroupedData, "Reptiles");
                data_to_parent(app.groupedDataVariables, "Group B", tempGroupedData, "Birds");
                data_to_parent(app.groupedDataVariables, "Group B", tempGroupedData, "Insects");
                data_to_parent(app.groupedDataVariables, "NoParent", tempGroupedData);


                /**
                 * Count the number of parents in data set
                 * @param groupedData - object. Contains menu items with parents
                 * @param parentItems - integer. Number of parent menu items
                 * @returns {parentItems}. Integer - number of parents
                 */
                var count_parents = function (groupedData, parentItems) {
                    for (var name in groupedData) {
                        if (groupedData.hasOwnProperty(name) && name !== "NoParent") {
                            parentItems++;
                            if (!Array.isArray(groupedData[name])) {
                                parentItems = count_parents(groupedData[name], parentItems);
                            }
                        }
                    }
                    return parentItems;
                };
                // Calculate number of parent menu items
                var parentItems = count_parents(app.groupedDataVariables, 0);
                app.menuSize = dataVariables.length + parentItems;
                app.menuSelected = {};

                var divContainer = document.getElementById("data_container" + appdata.id);

                /**
                 * Create HTML menu item
                 * @param menuCount - integer. Menu item's index
                 * @param groupedData - object. Contains menu items with parents
                 * @param divContainer - HTML element. DIV container where menu is created
                 * @param menuSize - integer. Number of total menu items
                 * @param create_menu_ul - function. Create HTML element UL
                 * @param create_menu_li - function. Create HTML element LI
                 * @param appID - string. Unique SAGE2 app ID
                 * @param appMenuSelected - Object. Track what menu items are selected
                 * @param padding - string. List left padding
                 */
                var create_menu_item = function (menuCount, groupedData, divContainer, menuSize, create_menu_ul, create_menu_li, appID, appMenuSelected, padding) {
                    for (var name in groupedData) {
                        if (groupedData.hasOwnProperty(name) && name !== "NoParent") {
                            // Check if property's child is a parent itself
                            var ulElement;
                            ulElement = create_menu_ul(divContainer);
                            menuCount[0] += 1;
                            create_menu_li(menuCount, name, menuSize, appID, ulElement, appMenuSelected, padding + "%");
                            if (!Array.isArray(groupedData[name])) {
                                create_menu_item(menuCount, groupedData[name], divContainer, menuSize, create_menu_ul, create_menu_li, appID, appMenuSelected, padding + 5);
                            } else {
                                var childUlelement = create_menu_ul(ulElement);
                                for (var i = 0; i < groupedData[name].length; i++) {
                                    menuCount[0] += 1;
                                    create_menu_li(menuCount, groupedData[name][i], menuSize, appID, childUlelement, appMenuSelected, padding + 5 + "%");
                                }
                            }
                        }
                    }
                };

                /**
                 * Create HTML menu
                 * @param groupedDataVariables - object. Contains menu items with parents
                 * @param divContainer - HTML element. DIV container where menu is created
                 * @param menuSize - integer. Number of total menu items
                 * @param create_menu_ul - function. Create HTML element UL
                 * @param create_menu_li - function. Create HTML element LI
                 * @param appID - string. Unique SAGE2 app ID
                 * @param appMenuSelected - Object. Track what menu items are selected
                 */
                var create_menu = function (groupedDataVariables, divContainer, menuSize, create_menu_ul, create_menu_li, appID, appMenuSelected) {
                    var menuCount = [0];
                    // Create menu variables with no parents
                    for (var i = 0; i < groupedDataVariables["NoParent"].length; i++) {
                        var parentUlElement = create_menu_ul(divContainer);
                        menuCount[0] += 1;
                        create_menu_li(menuCount, groupedDataVariables["NoParent"][i], menuSize, appID, parentUlElement, appMenuSelected);
                    }
                    //
                    create_menu_item(menuCount, groupedDataVariables, divContainer, menuSize, create_menu_ul, create_menu_li, appID, appMenuSelected, 0);
                };

                create_menu(app.groupedDataVariables, divContainer, app.menuSize, create_menu_ul, create_menu_li, appdata.id, app.menuSelected);


                var onFrame = window.requestAnimationFrame;

                var tick = function (timestamp) {
                    app.threeRender1.startRender();

                    onFrame(tick);
                };

                onFrame(tick);

                console.log("map3d-html.js Version 4");

            })  //getJSON

        );
    }//after get CSV then

    /**
     * Create Csv HTML menu item
     * @param initialCsv - string. File name of first CSV to load
     * @param menuDataSelected - Object. Keeps track of items selected in csv menu
     * @param csvFileNames - array. List of all CSV file names
     * @param divContainer - HTML element. DIV container where menu is created
     * @param appID - string. ID of SAGE2 app
     * @param appCsvMenuSelected - Object. Keeps track of item selected in csv menu
     */
    function create_csv_menu(initialCsv, menuDataSelected, csvFileNames, divContainer, appID, appCsvMenuSelected) {
        var menuCount = [1];
        var parentUlElement = create_menu_ul(divContainer, true);
        var csvFileNamesLength = csvFileNames.length;
        for (var i = 0; i < csvFileNamesLength; i++) {
            create_menu_li(menuCount, csvFileNames[i], csvFileNamesLength, appID, parentUlElement, appCsvMenuSelected);
            menuCount[0] += 1;
        }
        var initialCsvFileName = initialCsv + appID;
        appCsvMenuSelected[initialCsvFileName][2] = menuDataSelected;
        document.getElementById(initialCsvFileName).style.color = menuDataSelected;
    }

    // Get CSV files based on csvFileNames.txt
    $.when($.get(app.resrcPath + "scripts/csvFileNames.txt", function(data) {
        app.csvFileNames = data.split("\n");
        app.csvFileNames.sort();
        if (app.csvFileNames[0] == "") app.csvFileNames.shift(); // csvFileNames' first element is empty because of bash/.bat script in /scripts
        app.latestCsv = app.csvFileNames[0];
        app.selectCsv = [app.latestCsv];
        app.initialCsv = app.latestCsv;
        app.currentCsv = app.latestCsv;
        app.csvPath = app.resrcPath + "data/" + app.latestCsv;
        for (var i = 0; i < app.csvFileNames.length; i++) {
            app.dataCsvStore[app.csvFileNames[i]] = {};
            app.csvNoLGAs[app.csvFileNames[i]] = app.noLGAs;
        }
    // Parse CSV files
    })).then(function() {
        for (var i = 1; i < app.csvFileNames.length; i++) {
            parseCsv(app, app.csvFileNames[i], app.dataCsvStore);
        }
        loadCsv(app, app.latestCsv, app.dataCsvStore);
        var divContainer = document.getElementById("csv_data_container" + appdata.id);
        create_csv_menu(app.selectCsv[0], app.menuDataSelected, app.csvFileNames, divContainer, appdata.id, app.csvMenuSelected);
        document.getElementById("csv-name" + appdata.id).innerHTML = app.latestCsv;
    });

}




