// 生成模拟数据的工厂函数
const generateTrendData = (baseValue, volatility) => {
  let current = baseValue
  return Array.from({ length: 50 }, () => {
    current = current * (1 + (Math.random() - 0.5) * volatility)
    return Number(current.toFixed(2))
  })
}

// 生成更真实的购买数据
const PRODUCTS = [
  { name: "智能手表", priceRange: [299, 599], buyers: ["年轻用户", "科技爱好者"] },
  { name: "无线耳机", priceRange: [199, 399], buyers: ["学生", "上班族"] },
  { name: "智能家居套装", priceRange: [999, 1999], buyers: ["家庭用户"] }
];

export const generateMockData = (type) => {
  const dataSize = type === 'scatter' ? 100 : 50
  const baseTime = Date.now() - 7 * 24 * 3600 * 1000 // 过去30天
  
  // 生成符合现实的演示数据
  const realisticValues = {
    '产品A': { base: 500, volatility: 0.1 },
    '产品B': { base: 300, volatility: 0.15 },
    '服务C': { base: 200, volatility: 0.2 }
  }

  return Array.from({ length: 500 }, (_, i) => {
    const product = PRODUCTS[i % 3]
    const priceRange = product.priceRange
    const price = priceRange[0] + Math.random() * (priceRange[1] - priceRange[0])
    const quantity = Math.floor(Math.random() * 4) + 1 // 1-5件
    
    return {
      product: product.name,
      price: Number(price.toFixed(2)),
      quantity,
      value: Number((price * quantity).toFixed(2)), // 确保value字段存在
      timestamp: Date.now() - Math.floor(Math.random() * 30) * 86400000,
      meta: {
        category: product.name,
        buyer: product.buyers[Math.floor(Math.random() * product.buyers.length)],
        returnRate: Math.random() < 0.1 ? Number((Math.random() * 0.15).toFixed(2)) : 0
      }
    }
  })
}

// 添加缺失的配置声明
const CHART_AXIS_CONFIG = {
  line: {
    x: '时间',
    y: '数值指标'
  },
  bar: {
    x: '区域分类',
    y: '销售额(万元)'
  },
  scatter: {
    x: '基准值',
    y: '随机分布'
  }
}

// 修改后的fetchChartData方法
export const fetchChartData = async (type) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    data: generateMockData(type),
    title: `${typeMap[type].title} - ${new Date().toLocaleDateString()}`,
    chartType: type,
    lastUpdated: new Date().toISOString(),
    axis: CHART_AXIS_CONFIG[type] || {} // 添加容错处理
  }
}

const typeMap = {
  line: { title: '趋势分析' },
  bar: { title: '分类统计' },
  scatter: { title: '分布观察' }
} 