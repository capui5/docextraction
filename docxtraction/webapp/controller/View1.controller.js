sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.docxtraction.docxtraction.controller.View1", {
        onInit: function () {

        },
       onVersionUpload : function(){
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("View2");
       }
    });
});