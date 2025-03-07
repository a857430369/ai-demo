describe('Flappy Bird Game', () => {
  beforeEach(() => {
    cy.visit('/games/flappy')
  })

  it('should detect collision with upper pipe', () => {
    // 设置初始状态
    cy.window().then(win => {
      win.bird.y = 100
      win.pipes = [{
        x: 70, // 小鸟位于50px，宽度30，所以右边界80
        top: 0,
        height: 90, // 管道高度90px
        passed: false
      }]
    })

    cy.get('.bird').should('have.class', 'colliding')
  })

  it('should detect collision with lower pipe', () => {
    cy.window().then(win => {
      win.bird.y = 400
      win.pipes = [{
        x: 70,
        top: 300, // 下管道起始位置
        height: 300, // GAME_HEIGHT=600, 600-300=300
        passed: false
      }]
    })

    cy.get('.bird').should('have.class', 'colliding')
  })

  it('should pass through safely', () => {
    cy.window().then(win => {
      win.bird.y = 200
      win.pipes = [{
        x: 100, // 管道在小鸟右侧
        top: 0,
        height: 150,
        passed: false
      }, {
        x: 100,
        top: 300, // 150+150=300
        height: 300,
        passed: false
      }]
    })

    cy.get('.bird').should('not.have.class', 'colliding')
  })
}) 