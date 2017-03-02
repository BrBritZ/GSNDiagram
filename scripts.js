// Copyright 1998-2017 by Northwoods Software Corporation.

// Free licenses available for academic and educational purposes, referenced on https://www.nwoods.com/sales/academic-use.html
// Use for academic purpose by Teerawatt Teeravatcharoenchai
// University of Glasgow, Computing Science

function init() {
    var $ = go.GraphObject.make;	// for conciseness in defining templates
    
    //add custom predefined shape for undeveloped goal element
    go.Shape.defineFigureGenerator("RectDiamond", function(shape, w, h) {
        var geo = new go.Geometry();
        
        //rectengle
        var fig = new go.PathFigure(0, 0, true);
        fig.add(new go.PathSegment(go.PathSegment.Line, w, 0));
        fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.7 * h));
        fig.add(new go.PathSegment(go.PathSegment.Line, 0, 0.7 * h).close());
        geo.add(fig);

        //diamond
        var fig2 = new go.PathFigure(0.5 * w, 0.7 * h);
        fig2.add(new go.PathSegment(go.PathSegment.Line, 0.4 * w, 0.85 * h));
        fig2.add(new go.PathSegment(go.PathSegment.Line, 0.5 * w, h));
        fig2.add(new go.PathSegment(go.PathSegment.Line, 0.6 * w, 0.85 * h).close());
        geo.add(fig2);

        //add more space for avoid text overlap with image border
        geo.spot1 = new go.Spot(0, 0, 0, 0);
        geo.spot2 = new go.Spot(1, 1, 0, -15);

        return geo;
    });
    


    myDiagram =
        $(go.Diagram, "myDiagramDiv",	// must name or refer to the DIV HTML element
            {
                grid: $(go.Panel, "Grid",
                                $(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                                $(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
                                $(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                                $(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
                            ),
                allowDrop: true,	// must be true to accept drops from the Palette
                "draggingTool.dragsLink": true,
                "draggingTool.isGridSnapEnabled": true,
                "linkingTool.isUnconnectedLinkValid": true,
                "linkingTool.portGravity": 20,
                "relinkingTool.isUnconnectedLinkValid": true,
                "relinkingTool.portGravity": 20,
                "relinkingTool.fromHandleArchetype":
                    $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
                "relinkingTool.toHandleArchetype":
                    $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
                "linkReshapingTool.handleArchetype":
                    $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
                rotatingTool: $(TopRotatingTool),	// defined below
                "rotatingTool.snapAngleMultiple": 15,
                "rotatingTool.snapAngleEpsilon": 15,
                "undoManager.isEnabled": true
            });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function(e) {
        var button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        var idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    });

    // Define a function for creating a "port" that is normally transparent.
    // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
    // and where the port is positioned on the node, and the boolean "output" and "input" arguments
    // control whether the user can draw links from or to the port.
    function makePort(name, spot, output, input) {
        // the port is basically just a small transparent square
        return $(go.Shape, "Circle",
                         {
                                fill: null,	// not seen, by default; set to a translucent gray by showSmallPorts, defined below
                                stroke: null,
                                desiredSize: new go.Size(7, 7),
                                alignment: spot,	// align the port on the main Shape
                                alignmentFocus: spot,	// just inside the Shape
                                portId: name,	// declare this object to be a "port"
                                fromSpot: spot, toSpot: spot,	// declare where links may connect at this port
                                fromLinkable: output, toLinkable: input,	// declare whether the user may draw links to/from here
                                cursor: "pointer"	// show a different cursor to indicate potential link point
                         });
    }

    var nodeSelectionAdornmentTemplate =
        $(go.Adornment, "Auto",
            $(go.Shape, { fill: null, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] }),
            $(go.Placeholder)
        );

    var nodeResizeAdornmentTemplate =
        $(go.Adornment, "Spot",
            { locationSpot: go.Spot.Right },
            $(go.Placeholder),
            $(go.Shape, { alignment: go.Spot.TopLeft, cursor: "nw-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { alignment: go.Spot.Top, cursor: "n-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { alignment: go.Spot.TopRight, cursor: "ne-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),

            $(go.Shape, { alignment: go.Spot.Left, cursor: "w-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { alignment: go.Spot.Right, cursor: "e-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),

            $(go.Shape, { alignment: go.Spot.BottomLeft, cursor: "se-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { alignment: go.Spot.Bottom, cursor: "s-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { alignment: go.Spot.BottomRight, cursor: "sw-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" })
        );

    var nodeRotateAdornmentTemplate =
        $(go.Adornment,
            { locationSpot: go.Spot.Center, locationObjectName: "CIRCLE" },
            $(go.Shape, "Circle", { name: "CIRCLE", cursor: "pointer", desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
            $(go.Shape, { geometryString: "M3.5 7 L3.5 30", isGeometryPositioned: true, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] })
        );

    myDiagram.nodeTemplate =
        $(go.Node, "Spot",
            { locationSpot: go.Spot.Center },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            { selectable: true, selectionAdornmentTemplate: nodeSelectionAdornmentTemplate },
            { resizable: true, resizeObjectName: "PANEL", resizeAdornmentTemplate: nodeResizeAdornmentTemplate },
            { rotatable: true, rotateAdornmentTemplate: nodeRotateAdornmentTemplate },
            new go.Binding("angle").makeTwoWay(),
            // the main object is a Panel that surrounds a TextBlock with a Shape
            $(go.Panel, "Auto",
                { name: "PANEL" },
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                $(go.Shape, "Rectangle",	// default figure
                    {
                        portId: "", // the default port: if no spot on link data, use closest side
                        fromLinkable: true, toLinkable: true, cursor: "pointer",
                        fill: "white",	// default color
                        strokeWidth: 2
                    },
                    new go.Binding("figure"),
                    new go.Binding("fill")),
                $(go.TextBlock,
                    {
                        font: "bold 11pt Helvetica, Arial, sans-serif",
                        margin: 8,
                        maxSize: new go.Size(160, NaN),
                        wrap: go.TextBlock.WrapFit,
                        editable: true
                    },
                    new go.Binding("text").makeTwoWay())
            ),
            // four small named ports, one on each side:
            makePort("T", go.Spot.Top, false, true),
            makePort("L", go.Spot.Left, true, true),
            makePort("R", go.Spot.Right, true, true),
            makePort("B", go.Spot.Bottom, true, false),
            { // handle mouse enter/leave events to show/hide the ports
                mouseEnter: function(e, node) { showSmallPorts(node, true); },
                mouseLeave: function(e, node) { showSmallPorts(node, false); }
            }
        );

    function showSmallPorts(node, show) {
        node.ports.each(function(port) {
            if (port.portId !== "") {	// don't change the default port, which is the big shape
                port.fill = show ? "rgba(0,0,0,.3)" : null;
            }
        });
    }

    var linkSelectionAdornmentTemplate =
        $(go.Adornment, "Link",
            $(go.Shape,
                // isPanelMain declares that this Shape shares the Link.geometry
                { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 })	// use selection object's strokeWidth
        );

    myDiagram.linkTemplate =
        $(go.Link,	// the whole link panel
            { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },
            { relinkableFrom: true, relinkableTo: true, reshapable: true },
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
            },
            new go.Binding("points").makeTwoWay(),
            $(go.Shape,	// the link path shape
                { isPanelMain: true, strokeWidth: 2 }),
            $(go.Shape,	// the arrowhead
                { toArrow: "Standard", stroke: null }),
            $(go.Panel, "Auto",
                new go.Binding("visible", "isSelected").ofObject(),
                $(go.Shape, "RoundedRectangle",	// the link shape
                    { fill: "#F8F8F8", stroke: null }),
                $(go.TextBlock,
                    {
                        textAlign: "center",
                        font: "10pt helvetica, arial, sans-serif",
                        stroke: "#919191",
                        margin: 2,
                        minSize: new go.Size(10, NaN),
                        editable: true
                    },
                    new go.Binding("text").makeTwoWay())
            )
        );


    load();	// load an initial diagram from some JSON text

    // initialize the Palette that is on the left side of the page
    myPalette =
        $(go.Palette, "myPaletteDiv",	// must name or refer to the DIV HTML element
            {
                maxSelectionCount: 1,
                nodeTemplateMap: myDiagram.nodeTemplateMap,	// share the templates used by myDiagram
                linkTemplate: // simplify the link template, just in this Palette
                    $(go.Link,
                        { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
                            // to line up the Link in the same manner we have to pretend the Link has the same location spot
                            locationSpot: go.Spot.Center,
                            selectionAdornmentTemplate:
                                $(go.Adornment, "Link",
                                    { locationSpot: go.Spot.Center },
                                    $(go.Shape,
                                        { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                                    $(go.Shape,	// the arrowhead
                                        { toArrow: "Standard", stroke: null })
                                )
                        },
                        {
                            routing: go.Link.AvoidsNodes,
                            curve: go.Link.JumpOver,
                            corner: 5,
                            toShortLength: 4
                        },
                        new go.Binding("points"),
                        $(go.Shape,	// the link path shape
                            { isPanelMain: true, strokeWidth: 2 }),
                        $(go.Shape,	// the arrowhead
                            { toArrow: "Standard", stroke: null })
                    ),
                model: new go.GraphLinksModel([	// specify the contents of the Palette
                    
                    { text: "Goal", figure: "Rectangle", fill: "#FFFFFF" },
                    { text: "Context", figure: "RoundedRectangle", fill: "#FFFFFF" },
                    { text: "Claim", figure: "Circle", fill: "#FFFFFF" },
                    { text: "Strategy", figure: "Parallelogram1", fill: "#FFFFFF" },
                    { text: "Undeveloped \n Goal", figure: "RectDiamond", fill: "#FFFFFF" },

                ], [
                    // the Palette also has a disconnected Link, which the user can drag-and-drop
                    { points: new go.List(go.Point).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
                ])
            });
}


function TopRotatingTool() {
    go.RotatingTool.call(this);
}
go.Diagram.inherit(TopRotatingTool, go.RotatingTool);

/** @override */
TopRotatingTool.prototype.updateAdornments = function(part) {
    go.RotatingTool.prototype.updateAdornments.call(this, part);
    var adornment = part.findAdornment("Rotating");
    if (adornment !== null) {
        adornment.location = part.rotateObject.getDocumentPoint(new go.Spot(0.5, 0, 0, -30));	// above middle top
    }
};

/** @override */
TopRotatingTool.prototype.rotate = function(newangle) {
    go.RotatingTool.prototype.rotate.call(this, newangle + 90);
};
// end of TopRotatingTool class


// Show the diagram's model in JSON format that the user may edit
function save() {
    saveDiagramProperties();	// do this first, before writing to JSON
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
}
function load() {
    myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    loadDiagramProperties();	// do this after the Model.modelData has been brought into memory
}

function saveDiagramProperties() {
    myDiagram.model.modelData.position = go.Point.stringify(myDiagram.position);
}
function loadDiagramProperties(e) {
    // set Diagram.initialPosition, not Diagram.position, to handle initialization side-effects
    var pos = myDiagram.model.modelData.position;
    if (pos) myDiagram.initialPosition = go.Point.parse(pos);
}
// Load drone template
function loadDroneTemplate(){
   
    var modelText = document.getElementById('mySavedModel');
    var templateJson = 
'{ "class": "go.GraphLinksModel",' +
'  "linkFromPortIdProperty": "fromPort",' +
'  "linkToPortIdProperty": "toPort",' +
'  "modelData": {"position":"-196.03225129158125 -782.0914408481748"},' +
'  "nodeDataArray": [ ' +
'{"text":"G1: Drone system is acceptably safe and secure", "figure":"Rectangle", "fill":"#FFFFFF", "key":-1, "loc":"180 -680"},' +
'{"text":"S1: Argument over cyber security and safety issue", "figure":"Parallelogram1", "fill":"#FFFFFF", "key":-4, "loc":"180 -560"},' +
'{"text":"G2: Drone system is acceptably safe", "figure":"Rectangle", "fill":"#FFFFFF", "key":-3, "loc":"80 -430"},' +
'{"text":"G3: Drone system is acceptably secure", "figure":"Rectangle", "fill":"#FFFFFF", "key":-5, "loc":"290 -430"},' +
'{"text":"S2: Argument over the safety measure", "figure":"Parallelogram1", "fill":"#FFFFFF", "key":-6, "loc":"-70 -240"},' +
'{"text":"S3: Argument over the cyber security measure", "figure":"Parallelogram1", "fill":"#FFFFFF", "key":-7, "loc":"390 -240"},' +
'{"text":"G3: Dropping item", "figure":"Rectangle", "fill":"#FFFFFF", "key":-8, "loc":"-350 60"},' +
'{"text":"G4: Flown in no-fly zone(prohibited area or danger area", "figure":"Rectangle", "fill":"#FFFFFF", "key":-9, "loc":"-190 80"},' +
'{"text":"G5: Using camera in drone", "figure":"Rectangle", "fill":"#FFFFFF", "key":-10, "loc":"-10 70"},' +
'{"text":"G6: Allocation frequency of drone", "figure":"Rectangle", "fill":"#FFFFFF", "key":-11, "loc":"160 70"},' +
'{"text":"G7: Crashed or redirect to other location", "figure":"Rectangle", "fill":"#FFFFFF", "key":-12, "loc":"290 -70"},' +
'{"text":"G8: Unmoved and uncontrollable from command centre", "figure":"Rectangle", "fill":"#FFFFFF", "key":-13, "loc":"490 -70"},' +
'{"text":"G9: Information leaks", "figure":"Rectangle", "fill":"#FFFFFF", "key":-14, "loc":"670 -90"},' +
'{"text":"Drone weight is under 20 kg", "figure":"RoundedRectangle", "fill":"#FFFFFF", "key":-2, "loc":"400 -560"},' +
'{"text":"Context", "figure":"RoundedRectangle", "fill":"#FFFFFF", "key":-15, "loc":"-250 -240"},' +
'{"text":"Context", "figure":"RoundedRectangle", "fill":"#FFFFFF", "key":-16, "loc":"560 -240"}' +
' ],' +
'  "linkDataArray": [ ' +
'{"points":[180,-647.5999999999999,180,-637.5999999999999,180,-620,180,-620,180,-602.4,180,-592.4], "from":-1, "to":-4, "fromPort":"B", "toPort":"T"},' +
'{"from":-4, "to":-3, "fromPort":"", "toPort":"T", "points":[180,-527.5999999999999,180,-517.5999999999999,180,-491.09999999999997,80,-491.09999999999997,80,-464.6,80,-454.6]},' +
'{"from":-4, "to":-5, "fromPort":"B", "toPort":"T", "points":[180,-527.5999999999999,180,-517.5999999999999,180,-491.09999999999997,290,-491.09999999999997,290,-464.6,290,-454.6]},' +
'{"from":-3, "to":-6, "fromPort":"B", "toPort":"T", "points":[80,-405.40000000000003,80,-395.40000000000003,80,-335,-70,-335,-70,-274.6,-70,-264.6]},' +
'{"from":-6, "to":-9, "fromPort":"B", "toPort":"T", "points":[-70,-215.40000000000003,-70,-205.40000000000003,-70,-83.90000000000002,-190,-83.90000000000002,-190,37.599999999999994,-190,47.599999999999994]},' +
'{"from":-6, "to":-8, "fromPort":"", "toPort":"T", "points":[-70,-215.4,-70,-205.4,-70,-86.10000000000001,-350,-86.10000000000001,-350,33.19999999999999,-350,43.19999999999999]},' +
'{"from":-6, "to":-10, "fromPort":"B", "toPort":"T", "points":[-70,-215.40000000000003,-70,-205.40000000000003,-70,-85.00000000000001,-10,-85.00000000000001,-10,35.400000000000006,-10,45.400000000000006]},' +
'{"from":-6, "to":-11, "fromPort":"", "toPort":"T", "points":[-70,-215.4,-70,-205.4,-70,-85,160,-85,160,35.400000000000006,160,45.400000000000006]},' +
'{"from":-5, "to":-7, "fromPort":"B", "toPort":"", "points":[290,-405.40000000000003,290,-395.40000000000003,290,-338.9,390,-338.9,390,-282.4,390,-272.4]},' +
'{"from":-7, "to":-12, "fromPort":"B", "toPort":"", "points":[390,-207.59999999999997,390,-197.59999999999997,390,-155,290,-155,290,-112.4,290,-102.4]},' +
'{"from":-7, "to":-13, "fromPort":"", "toPort":"T", "points":[390,-207.59999999999997,390,-197.59999999999997,390,-155,490,-155,490,-112.4,490,-102.4]},' +
'{"from":-7, "to":-14, "fromPort":"B", "toPort":"T", "points":[390,-207.59999999999997,390,-197.59999999999997,390,-157.2,670,-157.2,670,-116.8,670,-106.8]},' +
'{"from":-6, "to":-15, "fromPort":"", "toPort":"R", "points":[-168.875,-240.00000000000003,-178.875,-240.00000000000003,-178.875,-240,-178.875,-240,-200.73857625084605,-240,-210.73857625084605,-240]},' +
'{"from":-7, "to":-16, "fromPort":"", "toPort":"L", "points":[488.875,-239.99999999999997,498.875,-239.99999999999997,498.875,-240,498.875,-240,510.738576250846,-240,520.738576250846,-240]},' +
'{"from":-4, "to":-2, "fromPort":"", "toPort":"L", "points":[264.25,-560,274.25,-560,274.25,-560,274.25,-560,301.23857625084605,-560,311.23857625084605,-560]}' +
 ']}';
 
 modelText.innerHTML = templateJson;
 load();
}
