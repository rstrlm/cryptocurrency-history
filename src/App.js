import React, { useState } from 'react'

const Coins = ({ info }) => {
  const dateAndTime = new Date(info[0])
  const dateAndTimeString = dateAndTime.toUTCString()
  return (
    <div>price {info[1]} eur, date and time {dateAndTimeString}</div>
  )
}

const CoinHistory = ({ data }) => {
  // console.log('coin history:', data)
  if (data) {
    if (data.length > 0) {
      const prices = data
      return prices.map(price =>
        <Coins key={price[0]} info={price} />
      )

    } else {
      return <div>No data</div>
    }
  } else {
    return <div>No data</div>
  }
}

const DownwardTrend = ({ data }) => {
  if (data) {
    return data.map(trends =>
      trends.map(trend =>
        <div key={trend[0]}><p>{trend[0]}</p><p>price {trend[1]}</p></div>
      )
    )
  } else {
    return <div>No data on trends</div>
  }
}
function App() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [notification, setNotification] = useState("")
  const [bitcoinHistory, setBitcoinHistory] = useState()
  const [downwardTrend, setDownwardTrend] = useState(null)


  /** 
   *  Date to time converter, converts date at midnight to Unix Timestamp
   *  Converting date to +0 UTC timezone for accurate information
   *  Need to remember to convert to localize time when showing data 
   */

  const convertDatetoTime = (date) => {
    const splitDate = date.split('-')
    const newDate = new Date(Date.UTC(splitDate[0], splitDate[1] - 1, splitDate[2], 0, 0, 0))
    // console.log(newDate.getTime()/1000)
    // console.log('date:' ,newDate.getTime()/1000)
    return newDate.getTime() / 1000
  }

  const handleFromDateChange = (e) => {
    e.preventDefault()
    setFromDate(e.target.value)
  }
  const handleToDateChange = (e) => {
    e.preventDefault()
    setToDate(e.target.value)
  }


  /**
   * 
   * @param {array} history 
   * @param {int} fromTime 
   * @param {int} days 
   * @returns filtered array
   * Loops through coins price history and searches value closest to searchTime
   * Days variable defines how many times it is done and each time its looped, day worth of milliseconds
   * is added to searchTime, after loop, closest value is pushed to array and after all loops, that array is returned
   */
  const filterToDailyBitcoinHistory = (history, fromTime, days) => {
    // console.log('inside filter', days)
    const millisecondsInDay = 3600 * 1000 * 24;
    const closestArray = []
    for (let i = 0; i <= days; i++) {
      // console.log('inside for loop')
      const searchTime = fromTime * 1000 + (millisecondsInDay * i)
      // console.log('searching for time', searchTime)
      const closest = history.reduce((first, second) => {
        let firstDifference = Math.abs(first[0] - searchTime)
        let secondDifference = Math.abs(second[0] - searchTime)
        if (firstDifference === secondDifference) {
          return first[0] < second[0] ? first : second
        } else {
          return secondDifference < firstDifference ? second : first
        }
      })
      closestArray.push(closest)
      // console.log('closest was', closest, 'searched for ',searchTime)

      // console.log('sorting: ',closestArray.sort((a,b) => b[0] - a[0]))
    }
    return closestArray.sort((a, b) => a[0] - b[0])
  }

  /**
   * 
   * @param {array} coinHistory 
   * 
   */
  const findDownwardTrend = (coinHistory) => {
    if (coinHistory) {
      let downwardDaysLenght = 0;
      let maxDownwardDays = 0;
      let lastBiggest = [];
      const arrayTrend = []
      const returnedArray = []
      for (let i = 0; i < coinHistory.length; i++) {
        const nextIndex = i + 1 < coinHistory.length ? i + 1 : i;
        // console.log(coinHistory[i][1],':vs:',coinHistory[nextIndex][1], coinHistory[i][1] > coinHistory[nextIndex][1])
        if (coinHistory[i][1] > coinHistory[nextIndex][1]) {
          if (i === 0) {
            arrayTrend.push(coinHistory[i])
            arrayTrend.push(coinHistory[nextIndex])
            downwardDaysLenght++
            downwardDaysLenght++
          } else {
            if (lastBiggest[1] === coinHistory[i][1]) {
              downwardDaysLenght++
              arrayTrend.push(lastBiggest)
            }
            arrayTrend.push(coinHistory[nextIndex])
            downwardDaysLenght++
          }
        } else {
          lastBiggest = coinHistory[nextIndex]
          if (downwardDaysLenght !== 0) {
            arrayTrend.push({ trendLength: downwardDaysLenght })
            maxDownwardDays = maxDownwardDays < downwardDaysLenght ? downwardDaysLenght : maxDownwardDays
            downwardDaysLenght = 0
          }
        }
      }
      for (let i = 0; i < arrayTrend.length; i++) {
        if (arrayTrend[i].trendLength) {
          const newArray = arrayTrend.slice((i - arrayTrend[i].trendLength), i)
          if (newArray.length === maxDownwardDays) {
            returnedArray.push(newArray)
          }
          // console.log((i-arrayTrend[i].trendLength), i)
          // console.log(newArray)  
        }
      }
      // console.log(maxDownwardDays)
      // console.log(returnedArray)
      return returnedArray.length !== 0 ? returnedArray : null
    }
  }

  const findHighestAndLowest = () => {

  }

  const searchBitcoins = (event) => {
    event.preventDefault()
    const fromTime = convertDatetoTime(fromDate)
    // adding 1 hour = 3600sec to toDate
    const toTime = convertDatetoTime(toDate) + 3600
    const days = (toTime - 3600 - fromTime) / (3600 * 24)
    // console.log(days)
    // console.log('days:', fromTime / (3600*24))
    // console.log('days:', toTime / (3600*24))
    if (fromTime > toTime) {
      console.log('ERROR, from date should be older than to date')
    } else {
      fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&from=${fromTime}&to=${toTime}`)
        .then(async response => {
          const data = await response.json()
          if (!response.ok) {
            const error = (data && data.message) || response.statusText
            setNotification(error)
            return Promise.reject(error)
          }
          //console.log('saving data: ', data.prices)
          const history = filterToDailyBitcoinHistory(data.prices, fromTime, days)
          setBitcoinHistory(history)
          setDownwardTrend(findDownwardTrend(history))

        })
        .catch(error => {
          console.log('error', error.toString())
        })
    }
    console.log(downwardTrend)
    console.log(bitcoinHistory)
  }

  return (
    <div>
      <form onSubmit={searchBitcoins}>
        <div> from date <input type="date" value={fromDate} name="FromDate" placeholder="dd/mm/yyyy" onChange={handleFromDateChange}></input></div>
        <div> to date <input type="date" value={toDate} name="ToDate" placeholder="dd/mm/yyyy" onChange={handleToDateChange}></input></div>
        <button id="search-bitcoin" type="submit">Search</button>
      </form>
      <div>
        <CoinHistory data={bitcoinHistory} />
        
        <DownwardTrend data={downwardTrend} />
      </div>
    </div>
  )
}

export default App;
