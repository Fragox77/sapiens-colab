const Project = require('../models/Project');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

function parseDateRange(query = {}) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  return { from, to };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function matchByRange(field, range) {
  return { [field]: { $gte: range.from, $lte: range.to } };
}

async function getFinanceKpis(range) {
  const completedMatch = {
    status: 'completado',
    ...matchByRange('completedAt', range),
  };

  const [financeAgg, weeklyFinance] = await Promise.all([
    Project.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: null,
          revenueTotal: { $sum: { $ifNull: ['$price', '$pricing.total'] } },
          costTotal: { $sum: { $ifNull: ['$cost', '$pricing.designerPay'] } },
          completedCount: { $sum: 1 },
        },
      },
    ]),
    Project.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$completedAt' },
            week: { $isoWeek: '$completedAt' },
          },
          revenue: { $sum: { $ifNull: ['$price', '$pricing.total'] } },
          cost: { $sum: { $ifNull: ['$cost', '$pricing.designerPay'] } },
          completedProjects: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 16 },
    ]),
  ]);

  const finance = financeAgg[0] || { revenueTotal: 0, costTotal: 0, completedCount: 0 };
  const margin = finance.revenueTotal > 0
    ? ((finance.revenueTotal - finance.costTotal) / finance.revenueTotal) * 100
    : 0;

  return {
    revenueTotal: round(finance.revenueTotal, 0),
    averageTicket: finance.completedCount > 0
      ? round(finance.revenueTotal / finance.completedCount, 0)
      : 0,
    marginPct: round(margin),
    costTotal: round(finance.costTotal, 0),
    completedCount: finance.completedCount,
    weeklyEvolution: weeklyFinance.map((item) => ({
      label: `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`,
      revenue: round(item.revenue, 0),
      cost: round(item.cost, 0),
      completedProjects: item.completedProjects,
    })),
  };
}

async function getOperationKpis(range) {
  const createdMatch = matchByRange('createdAt', range);

  const [statusAgg, efficiencyAgg, lateAgg] = await Promise.all([
    Project.aggregate([
      { $match: createdMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      {
        $match: {
          status: 'completado',
          ...matchByRange('completedAt', range),
          completedAt: { $ne: null },
        },
      },
      {
        $addFields: {
          startedAtResolved: { $ifNull: ['$startedAt', { $ifNull: ['$payments.anticipo.paidAt', '$createdAt'] }] },
        },
      },
      {
        $project: {
          deliveryDays: {
            $divide: [{ $subtract: ['$completedAt', '$startedAtResolved'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avgDeliveryDays: { $avg: '$deliveryDays' }, completedCount: { $sum: 1 } } },
    ]),
    Project.aggregate([
      {
        $match: {
          status: 'completado',
          ...matchByRange('completedAt', range),
          deadlineAt: { $ne: null },
          completedAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          delayed: {
            $sum: {
              $cond: [{ $gt: ['$completedAt', '$deadlineAt'] }, 1, 0],
            },
          },
          totalTimed: { $sum: 1 },
        },
      },
    ]),
  ]);

  const statusMap = statusAgg.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const totalProjects = Object.values(statusMap).reduce((acc, n) => acc + n, 0);
  const completedProjects = statusMap.completado || 0;
  const activeProjects = ['activo', 'revision', 'ajuste', 'aprobado']
    .reduce((acc, key) => acc + (statusMap[key] || 0), 0);

  const efficiency = efficiencyAgg[0] || { avgDeliveryDays: 0, completedCount: 0 };
  const late = lateAgg[0] || { delayed: 0, totalTimed: 0 };

  return {
    totalProjects,
    activeProjects,
    completionRatePct: totalProjects > 0 ? round((completedProjects / totalProjects) * 100) : 0,
    avgDeliveryDays: round(efficiency.avgDeliveryDays || 0),
    delayedProjects: late.delayed,
    delayRatePct: late.totalTimed > 0 ? round((late.delayed / late.totalTimed) * 100) : 0,
    statusDistribution: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
  };
}

async function getTalentAndClientKpis(range) {
  const [designerAgg, ratingsAgg, repurchaseAgg] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          ...matchByRange('createdAt', range),
          $or: [{ designer: { $ne: null } }, { assignedTo: { $ne: null } }],
        },
      },
      {
        $addFields: {
          designerRef: { $ifNull: ['$assignedTo', '$designer'] },
          startedAtResolved: { $ifNull: ['$startedAt', { $ifNull: ['$payments.anticipo.paidAt', '$createdAt'] }] },
        },
      },
      {
        $project: {
          designerRef: 1,
          status: 1,
          deadlineAt: 1,
          completedAt: 1,
          deliveryDays: {
            $cond: [
              { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAtResolved', null] }] },
              { $divide: [{ $subtract: ['$completedAt', '$startedAtResolved'] }, 1000 * 60 * 60 * 24] },
              null,
            ],
          },
          onTime: {
            $cond: [
              {
                $and: [
                  { $ne: ['$deadlineAt', null] },
                  { $ne: ['$completedAt', null] },
                  { $lte: ['$completedAt', '$deadlineAt'] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$designerRef',
          assignedProjects: { $sum: 1 },
          completedProjects: { $sum: { $cond: [{ $eq: ['$status', 'completado'] }, 1, 0] } },
          avgDeliveryDays: { $avg: '$deliveryDays' },
          onTimeProjects: { $sum: '$onTime' },
          measurableProjects: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$deadlineAt', null] }, { $ne: ['$completedAt', null] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'designer',
        },
      },
      { $unwind: '$designer' },
      {
        $project: {
          _id: 0,
          designerId: '$_id',
          name: '$designer.name',
          level: '$designer.level',
          specialty: '$designer.specialty',
          assignedProjects: 1,
          completedProjects: 1,
          avgDeliveryDays: 1,
          onTimeProjects: 1,
          measurableProjects: 1,
        },
      },
    ]),
    Feedback.aggregate([
      { $match: matchByRange('createdAt', range) },
      {
        $group: {
          _id: '$designer',
          avgRating: { $avg: '$rating' },
          ratingsCount: { $sum: 1 },
        },
      },
    ]),
    Project.aggregate([
      {
        $match: {
          status: 'completado',
          ...matchByRange('completedAt', range),
        },
      },
      {
        $project: {
          clientRef: { $ifNull: ['$clientId', '$client'] },
        },
      },
      {
        $group: {
          _id: '$clientRef',
          projectsCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          repeatClients: { $sum: { $cond: [{ $gt: ['$projectsCount', 1] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const ratingsMap = ratingsAgg.reduce((acc, row) => {
    acc[String(row._id)] = row;
    return acc;
  }, {});

  const ranking = designerAgg.map((row) => {
    const rating = ratingsMap[String(row.designerId)] || { avgRating: 0, ratingsCount: 0 };
    const completionRate = row.assignedProjects > 0
      ? (row.completedProjects / row.assignedProjects) * 100
      : 0;
    const onTimeRate = row.measurableProjects > 0
      ? (row.onTimeProjects / row.measurableProjects) * 100
      : 0;
    const qualityRate = (Number(rating.avgRating) / 5) * 100;
    const velocityRate = clamp(100 - Number(row.avgDeliveryDays || 0) * 4, 0, 100);

    const performanceScore = round(
      onTimeRate * 0.35 + completionRate * 0.25 + qualityRate * 0.25 + velocityRate * 0.15,
    );

    return {
      ...row,
      avgDeliveryDays: round(row.avgDeliveryDays || 0),
      avgRating: round(rating.avgRating || 0),
      ratingsCount: rating.ratingsCount || 0,
      completionRatePct: round(completionRate),
      onTimeRatePct: round(onTimeRate),
      performanceScore,
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore);

  if (ranking.length > 0) {
    await User.bulkWrite(
      ranking.map((item) => ({
        updateOne: {
          filter: { _id: item.designerId },
          update: { $set: { performanceScore: item.performanceScore } },
        },
      })),
      { ordered: false }
    );
  }

  const repurchase = repurchaseAgg[0] || { totalClients: 0, repeatClients: 0 };
  const globalSatisfaction = ratingsAgg.length > 0
    ? ratingsAgg.reduce((sum, item) => sum + (item.avgRating || 0) * item.ratingsCount, 0) /
      ratingsAgg.reduce((sum, item) => sum + item.ratingsCount, 0)
    : 0;

  return {
    ranking,
    satisfactionAvg: round(globalSatisfaction),
    repurchaseRatePct: repurchase.totalClients > 0
      ? round((repurchase.repeatClients / repurchase.totalClients) * 100)
      : 0,
    projectsPerDesignerAvg: ranking.length > 0
      ? round(ranking.reduce((sum, row) => sum + row.assignedProjects, 0) / ranking.length)
      : 0,
    avgDeliveryDaysPerDesigner: ranking.length > 0
      ? round(ranking.reduce((sum, row) => sum + row.avgDeliveryDays, 0) / ranking.length)
      : 0,
  };
}

async function getDashboardMetrics(query = {}) {
  const range = parseDateRange(query);
  const [finance, operation, talentClient] = await Promise.all([
    getFinanceKpis(range),
    getOperationKpis(range),
    getTalentAndClientKpis(range),
  ]);

  return {
    period: range,
    business: {
      revenueTotal: finance.revenueTotal,
      averageTicket: finance.averageTicket,
      marginPct: finance.marginPct,
    },
    operation: {
      activeProjects: operation.activeProjects,
      completionRatePct: operation.completionRatePct,
      avgDeliveryDays: operation.avgDeliveryDays,
      delayedProjects: operation.delayedProjects,
      delayRatePct: operation.delayRatePct,
    },
    talent: {
      projectsPerDesignerAvg: talentClient.projectsPerDesignerAvg,
      avgDeliveryDaysPerDesigner: talentClient.avgDeliveryDaysPerDesigner,
      topPerformers: talentClient.ranking.slice(0, 8),
    },
    client: {
      satisfactionAvg: talentClient.satisfactionAvg,
      repurchaseRatePct: talentClient.repurchaseRatePct,
    },
    charts: {
      statusDistribution: operation.statusDistribution,
      weeklyEvolution: finance.weeklyEvolution,
    },
  };
}

async function getPerformanceMetrics(query = {}) {
  const range = parseDateRange(query);
  const [operation, talentClient] = await Promise.all([
    getOperationKpis(range),
    getTalentAndClientKpis(range),
  ]);

  return {
    period: range,
    operation: {
      activeProjects: operation.activeProjects,
      completionRatePct: operation.completionRatePct,
      avgDeliveryDays: operation.avgDeliveryDays,
      delayedProjects: operation.delayedProjects,
      delayRatePct: operation.delayRatePct,
    },
    talent: {
      projectsPerDesignerAvg: talentClient.projectsPerDesignerAvg,
      avgDeliveryDaysPerDesigner: talentClient.avgDeliveryDaysPerDesigner,
      ranking: talentClient.ranking,
    },
    client: {
      satisfactionAvg: talentClient.satisfactionAvg,
      repurchaseRatePct: talentClient.repurchaseRatePct,
    },
  };
}

async function getFinanceMetrics(query = {}) {
  const range = parseDateRange(query);
  const finance = await getFinanceKpis(range);

  return {
    period: range,
    business: {
      revenueTotal: finance.revenueTotal,
      averageTicket: finance.averageTicket,
      marginPct: finance.marginPct,
      costTotal: finance.costTotal,
      completedCount: finance.completedCount,
    },
    weeklyEvolution: finance.weeklyEvolution,
  };
}

module.exports = {
  getDashboardMetrics,
  getPerformanceMetrics,
  getFinanceMetrics,
};