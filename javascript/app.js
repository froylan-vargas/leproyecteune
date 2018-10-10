var currentCurrency = {};
var apiUrl = 'https://proyecteapi.herokuapp.com';

function createCryptoCurrencyDataCall() {
    return {
        searchTerm: currentCurrency.shortName
    }
}

function cryptoCurrencyCall() {
    var currencyApiUrl = `${apiUrl}/crypto`;
    var data = createCryptoCurrencyDataCall();
    ajaxCall(currencyApiUrl, data).then(cryptoCurrencyResponse);
}

function cryptoCurrencyResponse(historic) {

    createPricesChart(historic);

    const prices = historic.map(elem => {
        return (Math.trunc(elem.rate));
    });

    var bollingerData = getBollingerData(historic, prices);
    bollingerData = bollingerData.reverse();
    console.log('bollingerDataReverse', bollingerData.reverse());

    //Si el precio de hoy es menor a upperBand de hoy && precio de ayer fue mayor a upperBand ======= VENTA!
    //Si no .= entonces si el precio de hoy es mayor a la lowerband y el precio de ayer fue menor a la lowerBand ========= COMPRA!
    // si no hay señal es HOLD

    //BONUS dejar señal de compra y venta si los ultimos 3 días es HOLD.  

    var bollingerSignal = "";
    if (bollingerData[0].price < bollingerData[0].upperBand && bollingerData[1].price > bollingerData[1].upperBand) {
        bollingerSignal = "SELL";
    } else if (bollingerData[0].price > bollingerData[0].lowerBand && bollingerData[1].price < bollingerData[1].lowerBand) {
        bollingerSignal = "BUY";
    } else {
        bollingerSignal = "HOLD";
    }

    console.log(bollingerSignal);



    const maData = getMaData(historic, prices).reverse();
    console.log('moving averages', maData);


    /* 
        if today avg20 < today avg50 && yest avg20 > yest avg 50 ========= SELL
        else if today avg20 > today avg50 && yest avg20 < yest avg 50 ======== BUY
        else HOLD

        TO DO: BONUS
    */
    var movingAveragesSignal = "";
    if (maData[0].avg20 < maData[0].avg50 && maData[1].avg20 > maData[1].avg50) {
        movingAveragesSignal = "SELL";
    } else if (maData[0].avg20 > maData[0].avg50 && maData[1].avg20 < maData[1].avg50) {
        movingAveragesSignal = "BUY";
    } else {
        movingAveragesSignal = "HOLD";
    }

    console.log('ma signal', movingAveragesSignal);


    const rsiData = getMacdData(historic, prices).reverse();
    console.log('rsi', rsiData);

    /* If rsi > 70 ======= SELL
     else if < 40 ======== BUY
     else HOLD
    */

    var rsiSignal = "";
    if (rsiData[0] > 70) {
        rsiSignal = "SELL";
    } else if (rsiData[0] < 40) {
        rsiSignal = "BUY";
    } else {
        rsiSignal = "HOLD";
    }

    console.log(rsiSignal);

}

function createPricesChart(historic) {
    var startDate = moment(new Date(moment(new Date()).subtract(365, 'days').calendar())).format('YYYY-MM-DD');
    var endDate = moment(new Date()).format('YYYY-MM-DD');

    $("#stock-chart").kendoStockChart({
        dataSource: {
            data: historic
        },
        title: {
            text: currentCurrency.name
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

function getBollingerData(historic, prices) {

    const takenDays = 21;

    const bollingerArray = prices.map((element, i) => {
        if (i - takenDays >= 0) {
            const avg = getAverage(prices.slice(i - takenDays, i));
            const stdv = getStdv(prices.slice(i - takenDays, i));
            const upperBand = avg + (2 * stdv);
            const lowerBand = avg - (2 * stdv);
            return {
                timestamp: historic[i].timestamp,
                price: element,
                upperBand,
                lowerBand
            }
        } else {
            return {
                timestamp: historic[i].timestamp,
                price: element,
                upperBand: null,
                lowerBand: null
            };
        }
    });

    return bollingerArray;
}

function getMaData(historic, prices) {
    const movingAveragesArray = prices.map((element, i) => {
        if (i - 50 >= 0) {
            const avg20 = getAverage(prices.slice(i - 20, i));
            const avg50 = getAverage(prices.slice(i - 50, i));
            return {
                timestamp: historic[i].timestamp,
                price: element,
                avg20,
                avg50
            }
        } else {
            return {
                timestamp: historic[i].timestamp,
                price: element,
                avg20: null,
                avg50: null
            };
        }
    });

    return movingAveragesArray;
}

function getMacdData(historic, prices) {
    const takenDays = 21;

    var returnArray = prices.map((elem, i) => {
        if (i === 0) {
            return null;
        } else {
            return (prices[i] / prices[i + 1]) - 1
        }
    });

    var positiveArray = returnArray.map(elem => {
        return elem > 0 ? 1 : 0;
    });



    var rsiArray = positiveArray.map((elem, i) => {
        if (i - takenDays >= 0) {
            return {
                timestamp: historic[i].timestamp,
                price: historic[i].rate,
                rsi: (getAverage(positiveArray.slice(i - takenDays, i))) * 100
            }
        } else {
            return null;
        }

    });


    return rsiArray;

}

function getMacdObject(historic, macd) {
    const macdArray = historic.map((element, i) => {
        return {
            timestamp: element.timestamp,
            price: element.rate,
            macd: macd.MACD[i],
            histogram: macd.histogram[i],
            signal: macd.signal[i]
        }
    });

    return macdArray;
}

function cryptoChangeActions() {
    displaySections();
    twitterCall();
    cryptoCurrencyCall();
}

function twitterCall() {
    const twitterUrl = `${apiUrl}/tweets`;
    const data = {
        searchTerm: currentCurrency.name
    }
    ajaxCall(twitterUrl, data).then(twitterResponse);
}

function twitterResponse(response) {
    const tweets = response.statuses;
    const firstTweet = tweets.slice(0, 1)[0];
    console.log("Twwet", firstTweet);
    const finalTweetText = urlify(firstTweet.text);
    $('#tweetText').html(finalTweetText);
    $('#tweetUserPic').attr('src', firstTweet.user.profile_image_url_https);
    $('#userUrl').attr('href', `https://twitter.com/@${firstTweet.user.screen_name}`)
    $('#userUrl').attr('target', '_blank')
    $('#tweetUser').text(`@${firstTweet.user.screen_name}`);
}

function ajaxCall(url, data) {
    return $.ajax({
        url,
        method: 'GET',
        data
    })
}

function getStdv(array) {
    return math.std(array);
}

function getAverage(array) {
    return math.mean(array)
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '">' + url + '</a>';
    })
}


function displaySections() {
    $('#learnButton').show();
    $('#analysis').show();
    $('#info').show();
}

//Handlers
function onBitcoinHandler() {
    currentCurrency = {
        name: 'bitcoin',
        shortName: 'XRP'
    }
    cryptoChangeActions();
}

//Bindings
$(".dropdown-item[data-value='BTC']").on('click', onBitcoinHandler);

