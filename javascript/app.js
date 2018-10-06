var currentCurrency = 'BTC';
var apiUrl = 'https://proyecteapi.herokuapp.com';
var startDate = moment(new Date(moment(new Date()).subtract(365, 'days').calendar())).format('YYYY-MM-DD');
var endDate = moment(new Date()).format('YYYY-MM-DD');

function createCryptoCurrencyDataCall() {
    return {
        key: '10bea72252e19dee1862e3d5958bef73',
        currency: currentCurrency,
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T00:00:00Z'
    }
}

function cryptoCurrencyCall() {
    var currencyApiUrl = 'https://api.nomics.com/v1/exchange-rates/history';
    var data = createCryptoCurrencyDataCall();
    ajaxCall(currencyApiUrl, data).then(cryptoCurrencyResponse);
}

function cryptoCurrencyResponse(historic) {
    const prices = historic.map(elem => {
        return Math.trunc(elem.rate);
    });

    $.when(getBollingerData(prices), getMacdData(prices), getMaData(prices)).done(function (bollingerResponse, macdResponse, maResponse) {
        console.log('bollinger', bollingerResponse[0]);
        console.log('macd', macdResponse[0]);
        console.log('moving averages', maResponse[0]);
    });

    createChart(historic);
}

function createChart(historic) {
    $("#stock-chart").kendoStockChart({
        dataSource: {
            data: historic
        },
        title: {
            text: currentCurrency
        },
        dateField: "timestamp",
        series: [{
            type: "line",
            field: "rate"
        }],
        categoryAxis: {
            labels: {
                rotation: "auto"
            }
        },
        navigator: {
            series: {
                type: "area",
                field: "rate"
            },
            select: {
                from: startDate,
                to: endDate
            },
            categoryAxis: {
                labels: {
                    rotation: "auto"
                }
            }
        }
    });
}

function getBollingerData(prices) {
    var url = `${apiUrl}/bollinger`;

    var data = {
        datum: JSON.stringify(prices),
        size: 21,
        times: 2
    };

    return ajaxCall(url, data);
}

function getMacdData(prices) {
    var url = `${apiUrl}/macd`;

    var data = {
        data: JSON.stringify(prices),
        slowPeriods: 26,
        fastPeriods: 12,
        signalPeriods: 9
    };

    return ajaxCall(url, data);
}

function getMaData(prices) {
    var url = `${apiUrl}/ma`;

    var data = {
        data: JSON.stringify(prices),
        size: 26
    };

    return ajaxCall(url, data);
}

function ajaxCall(url, data) {
    return $.ajax({
        url,
        method: 'GET',
        data
    })
}

cryptoCurrencyCall();