function JSModelGraphRetriever () {

};

JSModelGraphRetriever.prototype.callForGraphModel = function (graphModelId) {
    var graphModelRetrievalJavascriptInterface = Java.type('com.att.eg.cptl.capacityplanning.backendmodel.javascript.interfaces.GraphModelRetrievalJavascriptInterface');
    var result = graphModelRetrievalJavascriptInterface.getGraphModelById(graphModelId);
    return result;
};

JSModelGraphRetriever.prototype.tryToGetNonExistentGraphModel = function () {
    var graphModelRetrievalJavascriptInterface = Java.type('com.att.eg.cptl.capacityplanning.backendmodel.javascript.interfaces.GraphModelRetrievalJavascriptInterface');
    try {
        var result = graphModelRetrievalJavascriptInterface.getGraphModelById("546yh6go8u3457hg73458g5430h4578g45");
    } catch(exception) {
        return "Not Found can be handled by JS!";
    }
    return result;
};