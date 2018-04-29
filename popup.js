(function() {
var reloaded = false
$(document).ready(function() {
    var invoice = JSON.parse(window.localStorage.getItem("invoice"))
    if (invoice !== null && invoice.products.length !== 0) {
        $('#ctl00_cpMain_ddModelundefined').val(invoice.name)
        $('#ctl00_cpMain_ddModel').val(invoice.products[0].modelNumber)
        $('#ctl00_cpMain_ddModel').data('combobox').refresh()
        $find("ctl00_cpMain_dtEarned_dateInput").set_value(invoice.date)
        $('#ctl00_cpMain_txtInvoice').val(invoice.invoiceNumber)
        $('#ctl00_cpMain_txtCustomerName').val(invoice.name)
        $('#ctl00_cpMain_txtUnits').val(invoice.products[0].quantity)
        $('#ctl00_cpMain_txtPrice').val(invoice.products[0].sellPrice)
        
        invoice.products.shift()
        if (invoice.products.length === 0) {
            window.localStorage.removeItem("invoice")
        }
        else {
            window.localStorage.setItem("invoice", JSON.stringify(invoice))
        }
    
        reloaded = true
        document.getElementById('ctl00_cpMain_btnSubmit').click()
    }
    else {
        if ($('#ctl00_cpMain_divInvoiceFound').val() === "") {
            reloaded = true
            window.location.replace('http://coolbluerewards.co.nz/dfi/responsive/coolblue/UploadSales.aspx')
        }
    }
})

if (reloaded === true) exit()
function loadPdf(data) {
    return PDFJS.getDocument({data: data}).then(function(pdf) {
        var pages = [];
        for (var i = 0; i < pdf.numPages; i++) {
            pages.push(i);
        }
        return Promise.all(pages.map(function(pageNumber) {
            return pdf.getPage(pageNumber + 1).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                    return textContent.items.map(function(item) {
                        return item.str;
                    }).join(' ');
                });
            });
        })).then(function(pages) {
            return pages.join("\r\n");
        });
    });
}

function cleanText(text) {
    startIndex = text.indexOf("Amount$");
    endIndex =  text.indexOf("Total Discount");
    if (endIndex === -1) {
        endIndex = text.indexOf("Total Sale")
    }
    text = text.substring(startIndex, endIndex)
    text = text.replace(/\s+/g,' ').trim();
    return text;
}

function parseDiscounts(discountsText) {
    if (discountsText === undefined) {
        return 0.0
    }

    var totalDiscountValue = 0.0
    var regex = /[0-9.]+/g
    var match = regex.exec(discountsText)
    while (match != null) {
        var value = parsePrice(match[0])
        totalDiscountValue += value
        match = regex.exec(discountsText)
    }
    return totalDiscountValue
}

function parsePrice(priceString) {
    priceString = priceString.trim()
    priceString = priceString.replace(',', '')
    return parseFloat(priceString)
}

function Product(modelNumber, quantity, basePrice, discount) {
    this.name = products[modelNumber]
    this.modelNumber = modelNumber
    this.quantity = quantity
    if (discount > basePrice) {
        throw new Error("Discount was greater than sell price!")
    }
    this.sellPrice = (quantity * basePrice) - discount
}

function parseProdcuts(pdfText) {
    var text = pdfText;
    var regex = /(?:\d Years|\d+ Months) \d{4,6} (?:Fisher & Paykel|Elba) [^\(\)]+\(([A-Z0-9]+)\) (\d) ([0-9.,]+) 15 [0-9.,]+ (Discount (?:-[0-9.,]+\s)+)*/g
    var match = regex.exec(text)
    var products = []
    while (match != null) {
        var modelNumber = match[1]
        var quantity = parseInt(match[2])
        var basePrice = parsePrice(match[3])
        var discount = parseDiscounts(match[4])

        products.push(new Product(modelNumber, quantity, basePrice, discount))
        match = regex.exec(text)
    }
    return products
}

function getName(text) {
    var regex = /Cust\. no\.: \d+ ((?:[A-Za-z -]+)+)/
    var match = regex.exec(text)
    var name = match[1].trim()
    if (name === "Latitude Financial Services") {
        var regex1 = /\|\s+((?:\w\s?)+)/
        var match1 = regex1.exec(text)
        name = match1[1].trim()
    }
    return name
}

function getDate(text) {
    var regex = /Date [0-9]{9}\s+((?:[0-9]{1,4}\/?){3})/
    var match = regex.exec(text)
    return match[1]
}

function getInvNo(text) {
    var regex = /Date ([0-9]{9})/
    var match = regex.exec(text)
    return match[1].trim()
}

// Get all products into array
var products = {}
$("#ctl00_cpMain_ddModel option").each(function() { 
    products[$(this).val()] = $(this).text() 
})

function fillForm() {
    var invoice = JSON.parse(window.localStorage.getItem("invoice"))

    $('#ctl00_cpMain_ddModelundefined').val(invoice.name)
    $('#ctl00_cpMain_ddModel').val(invoice.products[0].modelNumber)
    $('#ctl00_cpMain_ddModel').data('combobox').refresh()
    $find("ctl00_cpMain_dtEarned_dateInput").set_value(invoice.date)
    $('#ctl00_cpMain_txtInvoice').val(invoice.invoiceNumber)
    $('#ctl00_cpMain_txtCustomerName').val(invoice.name)
    $('#ctl00_cpMain_txtUnits').val(invoice.products[0].quantity)
    $('#ctl00_cpMain_txtPrice').val(invoice.products[0].sellPrice)
    
    invoice.products.shift()
    window.localStorage.setItem("invoice", JSON.stringify(invoice))

    //document.getElementById('ctl00_cpMain_btnSubmit').click()
}

function addAutoFillButton() {
    var button = $('<input type="button" value="Auto Add Invoice" />')
    button.click(fillForm)
    $('#ctl00_cpMain_AsyUpDocumentrow1').append(button)
}

// How to add a listener to the files uploaded and get a ref to it
var handleFiles = function() {
    console.log(this.files)
    var reader = new FileReader()
    reader.onload = function() {
        loadPdf(reader.result).then(function(text) {
            console.log(text)
            var products = parseProdcuts(text)
            var invoice = {
                "invoiceNumber": getInvNo(text),
                "date": getDate(text),
                "name": getName(text),
                "products": parseProdcuts(text)
            }
            console.log(invoice)
            window.localStorage.setItem("invoice", JSON.stringify(invoice))
            addAutoFillButton()
        });
    }
    reader.readAsBinaryString(this.files[0])
}
var inputElement = $('*[id^="ctl00_cpMain_AsyUpDocumentfile"]')[0]
if (inputElement === undefined) return
inputElement.addEventListener("change", handleFiles, false)
})()
