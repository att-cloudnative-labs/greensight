function JSForecastClient (token) {
    this.token = token;
};

JSForecastClient.prototype.callForBranchData = function (branchId) {
    var forecastClientJavaScriptInterface = Java.type('com.att.eg.cptl.capacityplanning.backendmodel.client.ForcastClientJavaScriptInterface');
    var result = forecastClientJavaScriptInterface.getBranchData(branchId, this.token);
    return result;
};