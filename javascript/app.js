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
        return Math.trunc(elem.rate);
    });

    const bollingerData = getBollingerData(historic, prices);
    console.log('bollingerData', bollingerData);
    const maData = getMaData(historic, prices);
    console.log('moving averages', maData);

    //Call here ma and bollbands indicator results method. 


    $.when(getMacdData(prices)).done(function (macdResponse) {

        const macdData = getMacdObject(historic, macdResponse);
        console.log('MACD', macdData);

        //Call here the MACD indicator result

    });
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
                upperBand: 0,
                lowerBand: 0
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
                avg20: 0,
                avg50: 0
            };
        }
    });

    return movingAveragesArray;
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
    const finalTweetText = urlify (firstTweet.text);
    $('#tweetText').html(finalTweetText);
    $('#tweetUserPic').attr('src',firstTweet.user.profile_image_url_https);
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

function getStdv(data) {
    return math.std(data);
}

function getAverage(data) {
    return math.mean(data)
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
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
        shortName: 'BTC'
    }
    cryptoChangeActions();
}

//Bindings
$(".dropdown-item[data-value='btc']").on('click', onBitcoinHandler);

