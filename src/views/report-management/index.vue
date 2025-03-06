<template>
  <n-card title="综合数据分析看板">
    <template #header-extra>
      <n-space>
        <n-button @click="loadAllData" secondary>
          <template #icon><n-icon><reload-outline /></n-icon></template>
          全局刷新
        </n-button>
        <n-switch v-model:value="autoRefresh" @update:value="toggleAutoRefresh">
          <template #checked>自动刷新中</template>
          <template #unchecked>启用自动刷新</template>
        </n-switch>
      </n-space>
    </template>

    <n-spin :show="loading" description="数据加载中...">
      <n-grid cols="3" x-gap="12" y-gap="12" responsive="screen">
        <!-- 上方三个图表 -->
        <n-gi v-for="(chart, index) in charts.slice(0, 3)" :key="index">
          <n-card :title="chart.title" hoverable>
            <v-chart class="h-[300px]" :option="chart.option" autoresize />
          </n-card>
        </n-gi>

        <!-- 下方全宽图表 -->
        <n-gi span="3">
          <n-card :title="charts[3].title" hoverable>
            <v-chart class="h-[400px]" :option="charts[3].option" autoresize />
          </n-card>
        </n-gi>
      </n-grid>
    </n-spin>

    <template #action>
      <n-alert v-if="errorMessage" type="error" :title="errorMessage" class="mt-4" />
      <n-alert v-else type="info" title="数据说明" class="mt-4">
        当前展示{{ totalDataPoints.toLocaleString() }}条模拟数据
      </n-alert>
    </template>
  </n-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ReloadOutline } from '@vicons/ionicons5'
import { generateMockData, fetchChartData } from '@/api/mockDataService'

// 配置区 START -----------------------------------
// 自动刷新间隔（单位：毫秒）
const REFRESH_INTERVAL = 1000 * 5 // 5秒
// 默认开启自动刷新
const DEFAULT_AUTO_REFRESH = true
// 图表类型映射
const chartTypeMap = {
  line: '趋势分析',
  bar: '分类统计',
  scatter: '分布观察'
}
// 配置区 END -------------------------------------

// 注册echarts组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  DataZoomComponent
])

// 状态管理
const loading = ref(false)
const totalDataPoints = ref(0)
const charts = ref(Array(4).fill().map(() => ({
  title: '加载中...',
  option: {},
  data: []
})))

// 自动刷新相关状态
const refreshInterval = ref(null)
const autoRefresh = ref(DEFAULT_AUTO_REFRESH) // 使用默认配置

// 在组件中添加错误状态
const errorMessage = ref(null)

// 添加性能监控
const startTime = ref(0)

// 在createChartConfig函数前添加趋势计算函数
const calculateTrend = (dataPoints) => {
  if (dataPoints.length < 2) return '稳定'

  // 计算加权变化率
  const weights = dataPoints.map((_, i) => 0.5 ** (dataPoints.length - i - 1))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  const changes = dataPoints.slice(1).map((d, i) => {
    const prev = dataPoints[i].value
    const curr = d.value
    return ((curr - prev) / Math.abs(prev)) * weights[i]
  })

  const weightedChange = changes.reduce((sum, c) => sum + c, 0) / totalWeight

  // 判断趋势阈值
  if (weightedChange > 0.05) return '上升'
  if (weightedChange < -0.03) return '下降'
  return '波动'
}

// 数据清洗逻辑重构
const createChartConfig = (rawData, chartType) => {
  // 通用数据清洗
  const baseData = rawData.map(d => ({
    ...d,
    timestamp: Number(d.timestamp) || Date.now(),
    value: Number(Number(d.value).toFixed(2)),
    category: d.meta?.category || d.product || '其他'
  })).filter(d => d.value >= 0)

  // 图表类型专用处理
  const processors = {
    line: (data) => {
      // 趋势分析专用处理
      const sortedData = data.sort((a, b) => a.timestamp - b.timestamp)
      const windowSize = 5 // 滑动窗口大小

      const trendData = sortedData.map((d, index) => {
        // 计算加权移动平均
        const start = Math.max(0, index - windowSize)
        const end = index + 1
        const windowValues = sortedData.slice(start, end).map(x => x.value)
        const weights = windowValues.map((_, i) => 0.5 ** (windowSize - i))
        const totalWeight = weights.reduce((sum, w) => sum + w, 0)

        return {
          ...d,
          trendValue: windowValues.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight,
          changeRate: index > 0 ?
            (d.value - sortedData[index - 1].value) / sortedData[index - 1].value : 0
        }
      })

      return {
        xAxis: {
          type: 'time',
          min: trendData[0].timestamp,
          max: trendData[trendData.length - 1].timestamp
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value) => `${value.toFixed(2)} ↗`
          }
        },
        series: [
          {
            type: 'line',
            name: '原始数据',
            data: trendData.map(d => [d.timestamp, d.value]),
            symbolSize: 4,
            lineStyle: { width: 0.8, color: '#aaa' }
          },
          {
            type: 'line',
            name: '趋势线',
            data: trendData.map(d => [d.timestamp, d.trendValue]),
            smooth: 0.3,
            lineStyle: {
              width: 2,
              color: '#409EFF'
            },
            areaStyle: {
              color: 'rgba(64,158,255,0.1)'
            }
          }
        ]
      }
    },
    bar: (data) => {
      const categories = [...new Set(data.map(d => d.category))]
      const seriesData = categories.map(category => {
        const items = data.filter(d => d.category === category)
        return {
          name: category,
          value: items.reduce((sum, d) => sum + d.value, 0),
          count: items.length // 添加计数字段用于计算平均价
        }
      })

      return {
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { rotate: 45 }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: v => `¥${v.toFixed(2)}` }
        },
        series: [{
          type: 'bar',
          data: seriesData,
          itemStyle: {
            color: ({ dataIndex }) =>
              ['#409EFF', '#67C23A', '#E6A23C'][dataIndex % 3]
          }
        }]
      }
    },
    scatter: (data) => ({
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      series: [{
        type: 'scatter',
        data: data.map(d => [d.value, d.meta?.returnRate || 0]),
        symbolSize: 8
      }]
    })
  }

  // 合并通用配置
  return {
    title: { text: chartTypeMap[chartType], left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (chartType === 'line') {
          const raw = params[0]
          const trend = params[1]
          return `
            ${new Date(raw.value[0]).toLocaleDateString()}<br/>
            <span style="color:${raw.color}">● 原始值</span>: ${raw.value[1].toFixed(2)}<br/>
            <span style="color:${trend.color}">● 趋势值</span>: ${trend.value[1].toFixed(2)}<br/>
            日变化率: ${(trendData[raw.dataIndex].changeRate * 100).toFixed(1)}%
          `
        }
        return defaultTooltipFormatter(params, chartType)
      }
    },
    ...processors[chartType](baseData),
    grid: { containLabel: true, top: 80 },
    toolbox: { feature: { saveAsImage: {} } }
  }
}

// 增强mock数据生成
const generateSalesData = () => {
  const products = [
    { name: "智能手表", price: [299, 599], buyers: ["年轻人", "商务人士"] },
    { name: "无线耳机", price: [199, 399], buyers: ["学生", "上班族"] },
    { name: "智能家居", price: [999, 1999], buyers: ["家庭用户"] }
  ]

  return Array.from({ length: 500 }, (_, i) => {
    const product = products[i % 3]
    const price = product.price[0] +
      Math.random() * (product.price[1] - product.price[0])
    const quantity = Math.floor(Math.random() * 5) + 1

    return {
      product: product.name,
      price: Number(price.toFixed(2)),
      quantity,
      value: price * quantity,
      timestamp: Date.now() - Math.random() * 30 * 86400000,
      meta: {
        category: product.name,
        buyer: product.buyers[Math.floor(Math.random() * product.buyers.length)],
        returnRate: Math.random() < 0.1 ? 0.05 + Math.random() * 0.1 : 0
      }
    }
  })
}

// 修改后的数据加载方法
const loadAllData = async () => {
  try {
    console.log('正在加载数据，当前时间:', new Date().toLocaleTimeString())
    startTime.value = performance.now();
    errorMessage.value = null;
    loading.value = true;

    const chartConfigs = [
      { type: 'line' },
      { type: 'bar' },
      { type: 'scatter' },
      { type: 'line' }
    ];

    // 并行获取所有图表数据
    const chartPromises = chartConfigs.map(config =>
      fetchChartData(config.type)
    );

    const results = await Promise.all(chartPromises);

    charts.value = results.map((res, index) => {
      const config = chartConfigs[index];
      return {
        title: res.title,
        data: res.data,
        option: createChartConfig(res.data, config.type)
      };
    });

    totalDataPoints.value = charts.value.reduce((sum, c) => sum + c.data.length, 0);
  } catch (error) {
    console.error('完整错误堆栈:', {
      error,
      charts: charts.value.map(c => ({
        title: c.title,
        dataLength: c.data.length,
        optionKeys: Object.keys(c.option)
      }))
    })
    errorMessage.value = `数据加载失败: ${error.message}`;
    console.error('数据加载错误:', error);
  } finally {
    const duration = performance.now() - startTime.value;
    console.log(`加载耗时: ${duration.toFixed(2)}ms`);
    loading.value = false;
  }
};

// 初始化加载数据
onMounted(async () => {
  await loadAllData()
  if (autoRefresh.value) { // 根据默认配置自动启动
    startAutoRefresh()
  }
})

// 自动刷新逻辑
const startAutoRefresh = () => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
  refreshInterval.value = setInterval(() => {
    console.log('自动刷新触发', new Date().toLocaleTimeString())
    loadAllData()
  }, REFRESH_INTERVAL) // 使用配置的间隔
}

const toggleAutoRefresh = (value) => {
  autoRefresh.value = value
  if (value) {
    startAutoRefresh()
  } else {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 添加组件卸载时的清理
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// 修复3：全局错误边界
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason.message.includes('echarts')) {
    event.preventDefault()
    console.error('ECharts异常:', event.reason)
    errorMessage.value = '图表渲染异常，请检查数据格式'
  }
})
</script>
