sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/unified/FileUploader",
    "sap/ui/model/json/JSONModel",
    "sap/base/i18n/ResourceBundle",
    "sap/ui/thirdparty/jquery"  // Include jQuery
], function (Controller, MessageBox, MessageToast, FileUploader, JSONModel, ResourceBundle, jQuery) {
    "use strict";

    return Controller.extend("com.docxtraction.docxtraction.controller.Main", {
        _jobId: "",

        onInit: function () {
            const invoiceModel = new JSONModel({});
            this.getView().setModel(invoiceModel, "invoice");

            const viewModel = new JSONModel({
                editable: false,
                refreshEnabled: false,
                uploadEnabled: false
            });
            this.getView().setModel(viewModel, "viewModel");
            const ListModel = new JSONModel({
                editable: false,
                refreshEnabled: false,
                uploadEnabled: false
            });
            this.getView().setModel(ListModel, "ListModel");
            var oModel = new JSONModel({
                imageUrl: this._getBaseUrl() + "/document/jobs/pages/1",
                imageWidth: "900px"
            });
            this.getView().setModel(oModel);

        },
        OnSelectionChange: function (oEvent) {
            console.log("clicked");
            var oSelectedItem = oEvent.getParameter("listItem");

            // Get the binding context of the selected item
            var oContext = oSelectedItem.getBindingContext("ListModel");

            // Get the data of the selected item
            var oSelectedData = oContext.getObject();

            // Use the data as needed
            console.log("Selected item data:", oSelectedData.id);
            this._jobId = oSelectedData.id;
            this.onRefresh();
            var  selectedKey =1;
            var oModel = this.getView().getModel();
            var newUrl = this._getBaseUrl() + "/document/jobs/"+this._jobId+"/pages/" + selectedKey;

            oModel.setProperty("/imageUrl", newUrl);
        },
        onChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var selectedKey = oSelectedItem.getKey(); // Get the selected key

            var oModel = this.getView().getModel();
            var newUrl = this._getBaseUrl() + "/document/jobs/"+this._jobId+"/pages/" + selectedKey;

            oModel.setProperty("/imageUrl", newUrl);
        },

        handleUploadPress: async function () {
            if (this._jobId) {
                MessageBox.confirm(this.getResourceBundle().getText("confirmText"), {
                    onClose: async (action) => {
                        if (action === "OK") {
                            this._resetData();
                            await this._uploadFile();
                        }
                    }
                });
            } else {
                await this._uploadFile();
            }
        },

        onFileChange: function () {
            const fileUploader = this.byId("fileUploader");
            const isFileSelected = !!fileUploader.getValue();
            this.getView().getModel("viewModel").setProperty("/uploadEnabled", isFileSelected);
        },

        onRefresh: async function () {
        
            try {
                const statusResponse = await this._checkJobStatus();
                this._handleStatusResponse(statusResponse);
            } catch (error) {
                MessageBox.error("Error checking status: " + error.message);
            }
        },

        // onSave: function () {
        //     const url = this._getBaseUrlOfProcess()+ "/public/workflow/rest/v1/workflow-instances";
        //     const grossAmount = parseFloat(this.getView().byId("grossAmount").getValue());
	    //     const invoiceNumber = parseInt(this.getView().byId("documentNumber").getValue(), 10);
        //     let payload = {
        //         "definitionId": "us10.0f9061f7trial.luxasia2.invoicewf",
        //          "context": {
        //             gross_amount: grossAmount,
        //             arrival_date: this.getView().byId("documentDate").getValue(),
        //             departure_date: this.getView().byId("dueDate").getValue(),
        //             invoice_number: invoiceNumber,
        //             customer_name: "Teja",
        //             managerapproval: false
        //         }
        //         // "context": {
        //         //     "gross_amount": 1000,
        //         //     "arrival_date": "2024-07-01",
        //         //     "departure_date": "2024-07-01",
        //         //     "invoice_number": 123,
        //         //     "customer_name": "Teja",
        //         //     "managerapproval": false
        //         // }

        //     };
        
        //     return new Promise((resolve, reject) => {
        //         $.ajax({
        //             url: url,
        //             type: 'POST',
        //             data: JSON.stringify(payload), // Stringify the payload
        //             contentType: "application/json",
        //             processData: false,
        //             success: function (response) {
        //                 resolve(response);
        //             },
        //             error: function (jqXHR, textStatus, errorThrown) {
        //                 const errorMessage = "HTTP error, status = " + jqXHR.status;
        //                 MessageBox.error("Error posting to DIE: " + errorMessage);
        //                 reject(new Error(errorMessage));
        //             }
        //         });
        //     });
        // },

        onSave: function () {
            const url = this._getBaseUrlOfProcess() + "/public/workflow/rest/v1/workflow-instances";
            const grossAmount = parseFloat(this.getView().byId("grossAmount").getValue());
            const invoiceNumber = parseInt(this.getView().byId("documentNumber").getValue(), 10);
            let payload = {
                "definitionId": "us10.0f9061f7trial.luxasia2.invoicewf",
                "context": {
                    gross_amount: grossAmount,
                    arrival_date: this.getView().byId("documentDate").getValue(),
                    departure_date: this.getView().byId("dueDate").getValue(),
                    invoice_number: invoiceNumber,
                    customer_name: "Teja",
                    managerapproval: false
                }
                //  "context": {
                //     "gross_amount": 1000,
                //     "arrival_date": "2024-07-01",
                //     "departure_date": "2024-07-01",
                //     "invoice_number": 123,
                //     "customer_name": "Teja",
                //     "managerapproval": false
                // }
            };
        
            // Assuming you are using jQuery for AJAX call
            $.ajax({
                url: url,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function(response) {
                    sap.m.MessageBox.success("Workflow started successfully!");
                },
                error: function(error) {
                    sap.m.MessageBox.error("Failed to start the workflow.");
                }
            });
        },        
        

        _resetData: function () {
            this.getView().getModel("invoice").setData({});
            this._jobId = "";
        },

        _uploadFile: async function () {
            try {
                const fileUploader = this.byId("fileUploader");
                const file = fileUploader.oFileUpload.files[0];
                const formData = new FormData();
                formData.append("file", file, file.name);

                const options = this.getOwnerComponent().getModel("options").getData();
                formData.append("options", JSON.stringify(options));

                const uploadResponse = await this._sendUploadRequest(formData);
                this._jobId = uploadResponse.id;

                this.getView().getModel("viewModel").setProperty("/refreshEnabled", true);
            } catch (error) {
                MessageBox.error("Error uploading file: " + error.message);
            }
        },

        _sendUploadRequest: async function (formData) {
            const url = this._getBaseUrl() + "/document/jobs";
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        const errorMessage = "HTTP error, status = " + jqXHR.status;
                        MessageBox.error("Error posting to DIE: " + errorMessage);
                        reject(new Error(errorMessage));
                    }
                });
            });
            this.UpdateList();
        },

        _checkJobStatus: async function () {
            const url = this._getBaseUrl() + "/document/jobs/" + this._jobId;
            const response = await fetch(url, {
                method: 'GET'
            });
           
            if (!response.ok) {
                throw new Error("HTTP error, status = " + response.status);
            }
           
            return response.json();
           
          
          
        },

        _handleStatusResponse: function (response) {
           
            var data =  response;
            this.pagenos = data.pageCount;
            var pageData = [];
            for (var i = 1; i <= this.pagenos; i++) {
                pageData.push({ key: i, value: i });
            
            }
            var oPageModel = new JSONModel(pageData);
            this.getView().setModel(oPageModel, "pageModel");
            if (response.status === "DONE") {
                this._updateInvoiceData(response.extraction);
                const viewModel = this.getView().getModel("viewModel");
                viewModel.setProperty("/refreshEnabled", false);
                viewModel.setProperty("/editable", true);
            } else if (response.status === "PENDING") {
                MessageToast.show(this.getResourceBundle().getText("pendingText"));
            }
           
        },

        _getBaseUrl: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id")
            const appPath = appId.replaceAll(".", "/")
            const appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath + "/doc-info-extraction"
        },
        _getBaseUrlOfProcess: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id")
            const appPath = appId.replaceAll(".", "/")
            const appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath + "/sap_process_destinatiion"
        },

        UpdateList: async function () {
            const url = this._getBaseUrl() + "/document/jobs";
            try {
                const response = await fetch(url, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error("HTTP error, status = " + response.status);
                }

                const data = await response.json();

                // Update the ListModel with the fetched data
                const listModel = this.getView().getModel("ListModel");
                listModel.setData(data);
            } catch (error) {
                console.error('Error fetching the document jobs:', error);
            }
        },

        _updateInvoiceData: function (extractedData) {
            const headerFields = this._mapFieldsToObject(extractedData.headerFields);
            const lineItems = extractedData.lineItems.map(this._mapFieldsToObject);

            const invoiceData = {
                header: headerFields,
                items: lineItems
            };
            // const data =  response.json();
            // this.pagenos = data.pageCount;
            // var pageData = [];
            // for (var i = 1; i <= this.pagenos; i++) {
            //     pageData.push({ key: i, value: i });
            
            // }
            // var oPageModel = new JSONModel(pageData);
            // this.getView().setModel(oPageModel, "pageModel");
            this.getView().getModel("invoice").setData(invoiceData);
            console.log(invoiceData);
        },

        _mapFieldsToObject: function (fields) {
            return fields.reduce((result, field) => {
                result[field.name] = field.value;
                return result;
            }, {});
        }
    });
});
