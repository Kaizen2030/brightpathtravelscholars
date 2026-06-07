const JOB_IMAGE_POOLS = {
  Agriculture: [
    'https://images.pexels.com/photos/18860448/pexels-photo-18860448.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/26762732/pexels-photo-26762732.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/32415692/pexels-photo-32415692.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/35246301/pexels-photo-35246301.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/11444464/pexels-photo-11444464.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/9622956/pexels-photo-9622956.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Cleaning: [
    'https://images.pexels.com/photos/3770110/pexels-photo-3770110.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3747094/pexels-photo-3747094.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Construction: [
    'https://images.pexels.com/photos/14846150/pexels-photo-14846150.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/17395034/pexels-photo-17395034.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/11293619/pexels-photo-11293619.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/16368435/pexels-photo-16368435.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/5335019/pexels-photo-5335019.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/16244896/pexels-photo-16244896.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4966809/pexels-photo-4966809.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/30384162/pexels-photo-30384162.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/10383579/pexels-photo-10383579.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/12709142/pexels-photo-12709142.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Engineering: [
    'https://images.pexels.com/photos/32407077/pexels-photo-32407077.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/28806603/pexels-photo-28806603.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/32845696/pexels-photo-32845696.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Healthcare: [
    'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6129243/pexels-photo-6129243.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6129494/pexels-photo-6129494.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/32115898/pexels-photo-32115898.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/30263936/pexels-photo-30263936.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/34363795/pexels-photo-34363795.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/14829652/pexels-photo-14829652.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/5234508/pexels-photo-5234508.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6129236/pexels-photo-6129236.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4989179/pexels-photo-4989179.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/8949850/pexels-photo-8949850.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/34833852/pexels-photo-34833852.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Hospitality: [
    'https://images.pexels.com/photos/3770110/pexels-photo-3770110.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3771112/pexels-photo-3771112.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/29006838/pexels-photo-29006838.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  IT: [
    'https://images.pexels.com/photos/31709104/pexels-photo-31709104.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/34774356/pexels-photo-34774356.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/37828832/pexels-photo-37828832.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7794042/pexels-photo-7794042.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7652126/pexels-photo-7652126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/12902874/pexels-photo-12902874.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3747094/pexels-photo-3747094.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6803525/pexels-photo-6803525.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/36706825/pexels-photo-36706825.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7709124/pexels-photo-7709124.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/8547344/pexels-photo-8547344.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7689750/pexels-photo-7689750.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Manufacturing: [
    'https://images.pexels.com/photos/32407077/pexels-photo-32407077.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/28806603/pexels-photo-28806603.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/32845696/pexels-photo-32845696.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Transport: [
    'https://images.pexels.com/photos/33824581/pexels-photo-33824581.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/33824602/pexels-photo-33824602.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/18301310/pexels-photo-18301310.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  Warehouse: [
    'https://images.pexels.com/photos/16045331/pexels-photo-16045331.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4487362/pexels-photo-4487362.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4483943/pexels-photo-4483943.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4483864/pexels-photo-4483864.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4481258/pexels-photo-4481258.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6711660/pexels-photo-6711660.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
}

const JOB_IMAGE_TITLE_OVERRIDES = [
  {
    match: ['registered nurse', 'certified nursing assistant', 'care assistant', 'aged care worker', 'child care assistant', 'pharmacy assistant'],
    pool: JOB_IMAGE_POOLS.Healthcare,
  },
  {
    match: ['long haul truck driver', 'hgv driver', 'forklift operator'],
    pool: JOB_IMAGE_POOLS.Transport,
  },
  {
    match: ['warehouse picker', 'warehouse associate', 'warehouse operative', 'forklift operator', 'warehouse team lead'],
    pool: JOB_IMAGE_POOLS.Warehouse,
  },
  {
    match: ['hotel front desk agent', 'hotel housekeeper', 'housekeeping attendant', 'hotel housekeeping supervisor', 'chef de partie', 'kitchen steward', 'hotel room attendant'],
    pool: JOB_IMAGE_POOLS.Hospitality,
  },
  {
    match: ['farm worker', 'farm hand', 'fruit farm supervisor', 'vineyard farm worker', 'greenhouse farm worker', 'agricultural harvester operator', 'landscaping crew member'],
    pool: JOB_IMAGE_POOLS.Agriculture,
  },
  {
    match: ['construction labourer', 'construction site cleaner', 'carpenter', 'construction foreman', 'heavy equipment mechanic'],
    pool: JOB_IMAGE_POOLS.Construction,
  },
  {
    match: ['software engineer', 'software support analyst', 'data analyst'],
    pool: JOB_IMAGE_POOLS.IT,
  },
  {
    match: ['welder', 'industrial electrician', 'maintenance electrician', 'mechanical engineer', 'mechanical fitter', 'cnc machine operator', 'quality control technician', 'production worker', 'food production operator', 'meat processing technician', 'factory production worker'],
    pool: JOB_IMAGE_POOLS.Manufacturing,
  },
]

function text(value) {
  return String(value || '').toLowerCase()
}

function resolveJobPool(job) {
  const title = text(job?.title)
  const category = text(job?.category)

  for (const override of JOB_IMAGE_TITLE_OVERRIDES) {
    if (override.match.some((pattern) => title.includes(pattern))) {
      return override.pool
    }
  }

  if (
    title.includes('nurse') ||
    title.includes('care assistant') ||
    title.includes('aged care') ||
    title.includes('child care') ||
    title.includes('pharmacy assistant') ||
    title.includes('doctor') ||
    category === 'healthcare'
  ) {
    return JOB_IMAGE_POOLS.Healthcare
  }

  if (
    title.includes('truck driver') ||
    title.includes('hgv driver') ||
    title.includes('forklift') ||
    title.includes('logistics') ||
    title.includes('transport') ||
    category === 'transport'
  ) {
    return JOB_IMAGE_POOLS.Transport
  }

  if (
    title.includes('warehouse') ||
    title.includes('picker') ||
    title.includes('packer') ||
    title.includes('operative') ||
    title.includes('associate') ||
    title.includes('team lead')
  ) {
    return JOB_IMAGE_POOLS.Warehouse
  }

  if (
    title.includes('hotel') ||
    title.includes('housekeeping') ||
    title.includes('room attendant') ||
    title.includes('front desk') ||
    title.includes('receptionist') ||
    title.includes('chef') ||
    title.includes('kitchen') ||
    title.includes('steward') ||
    title.includes('catering') ||
    category === 'hospitality'
  ) {
    return JOB_IMAGE_POOLS.Hospitality
  }

  if (
    title.includes('farm') ||
    title.includes('agricultural') ||
    title.includes('vineyard') ||
    title.includes('greenhouse') ||
    title.includes('harvester') ||
    title.includes('fruit') ||
    title.includes('landscaping') ||
    category === 'agriculture'
  ) {
    return JOB_IMAGE_POOLS.Agriculture
  }

  if (
    title.includes('construction') ||
    title.includes('carpenter') ||
    title.includes('labourer') ||
    title.includes('foreman') ||
    title.includes('site cleaner') ||
    title.includes('builder') ||
    category === 'construction'
  ) {
    return JOB_IMAGE_POOLS.Construction
  }

  if (
    title.includes('software') ||
    title.includes('data analyst') ||
    title.includes('developer') ||
    title.includes('analyst') ||
    title.includes('it ') ||
    category === 'it'
  ) {
    return JOB_IMAGE_POOLS.IT
  }

  if (
    title.includes('welder') ||
    title.includes('electrician') ||
    title.includes('mechanic') ||
    title.includes('fitter') ||
    title.includes('technician') ||
    title.includes('production') ||
    title.includes('operator') ||
    title.includes('quality control') ||
    category === 'manufacturing' ||
    category === 'engineering'
  ) {
    return title.includes('operator') || title.includes('production') || title.includes('quality control')
      ? JOB_IMAGE_POOLS.Manufacturing
      : JOB_IMAGE_POOLS.Engineering
  }

  return JOB_IMAGE_POOLS.IT
}

function pickImageFromPool(pool, seed) {
  if (!pool.length) return ''
  const normalizedSeed = String(seed || '')
  let hash = 0

  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = (hash * 31 + normalizedSeed.charCodeAt(index)) >>> 0
  }

  return pool[hash % pool.length]
}

export function getJobImageUrl(job) {
  const pool = resolveJobPool(job)
  return pickImageFromPool(pool, `${job?.title || job?.id || 'job'}:${job?.region || ''}:${job?.country || 'global'}`)
}
