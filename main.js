const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished',
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
] // 首字母大寫表示儲存的資料不會變動

const model = {
  revealedCard: [],
  score: 0,
  triedTimes: 0,

  isRevealedCardsMatched() {
    return this.revealedCard[0].dataset.index % 13 === this.revealedCard[1].dataset.index % 13
  }
}

const view = {
  // getCardContent - 負責生成卡片內容(包括花色和數字)
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>`
  },

  // getCardElement - 生成牌背
  getCardElement(index) {
    return `<div class="card back" data-index="${index}"></div>`
  },

  // transformNumber - A、J、Q、K 的轉換
  transformNumber(number) {
    switch(number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // displayCards() - 負責選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },

  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }

      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
    
  },

  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationed', event => event.target.classList.remove('wrong'), {once: true})
    })
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
    <p>Completed!</p>
    <p>Score: ${model.score}</p>
    <p>You've tried ${model.triedTimes} times</p>`
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }

    return number
  }
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  resetCards() {
    view.flipCards(...model.revealedCard)
    model.revealedCard = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },

  dispatchCardAction(card) {
    if (!card.classList.contains('back')) { return }

    switch(this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCard.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCard.push(card)

        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCard)
          model.revealedCard = []
          
          if (model.score === 260) {
            console.log('Game finished!')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          view.appendWrongAnimation(...model.revealedCard)
          this.currentState = GAME_STATE.CardsMatchFailed
          setTimeout(this.resetCards, 1000)
        }
        break
    }
  }
}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})