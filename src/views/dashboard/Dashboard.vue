<template>
  <div class="dashboard-container">
    <div class="dashboard-inner">
      
      <!-- 顶部英雄区域：欢迎 + 快捷统计 -->
      <div class="hero-section" :class="{'card-animate': !loading.userInfo}">
        <div class="hero-content">
          <div class="hero-welcome">
            <h1 class="hero-title">{{ $t('dashboard.welcome') }} <span class="emoji">👋</span></h1>
            <p class="hero-desc">{{ $t('dashboard.welcomeDesc') }}</p>
            <p v-if="userStats.userEmail && DASHBOARD_CONFIG.showUserEmail" class="hero-email">
              <IconMail :size="16"/>
              <span>{{ userStats.userEmail }}</span>
            </p>
          </div>
          
          <!-- 快捷统计数据 - 嵌入英雄区 -->
          <div class="hero-stats" v-if="hasPlan && !loading.userStats">
            <div class="hero-stat-item clickable" :class="{'stat-warning': isLowTraffic && !isTrafficDepleted, 'stat-danger': isTrafficDepleted}" @click="router.push('/trafficlog')">
              <div class="stat-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path class="circle-fill" :stroke-dasharray="`${trafficPercentage}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
                <IconTransferVertical :size="18" class="stat-icon"/>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ userStats.remainingTraffic }}</span>
                <span class="stat-label">{{ $t('dashboard.remainingTraffic') }}</span>
              </div>
            </div>
            <div class="hero-stat-item" :class="{'stat-warning': isExpiringSoon && !isExpired, 'stat-danger': isExpired}">
              <div class="stat-circle">
                <IconCalendar :size="18" class="stat-icon solo"/>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ userStats.isRemainingDaysPermanent ? $t('dashboard.permanent') : userStats.remainingDays + $t('dashboard.days') }}</span>
                <span class="stat-label">{{ $t('dashboard.remainingDays') }}</span>
              </div>
            </div>
            <div class="hero-stat-item clickable" @click="router.push('/profile')">
              <div class="stat-circle">
                <IconWallet :size="18" class="stat-icon solo"/>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ userStats.accountBalance }}</span>
                <span class="stat-label">{{ $t('dashboard.accountBalance') }}</span>
              </div>
            </div>
            <div class="hero-stat-item clickable" @click="router.push('/invite')" v-if="parseFloat(userStats.commissionBalance) > 0">
              <div class="stat-circle commission">
                <IconGift :size="18" class="stat-icon solo"/>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ currencySymbol }}{{ userStats.commissionBalance }}</span>
                <span class="stat-label">{{ $t('dashboard.commissionBalance') }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 装饰背景 -->
        <div class="hero-decoration">
          <div class="deco-shape shape-1"></div>
          <div class="deco-shape shape-2"></div>
          <div class="deco-shape shape-3"></div>
        </div>
      </div>

      <!-- 移动端公告 - 仅在小屏幕显示 -->
      <div class="mobile-notice" v-if="notices && notices.data && notices.data.length > 0" :class="{'card-animate': !loading.notices}">
        <div class="notice-header">
          <div class="notice-title-row">
            <IconBell :size="18"/>
            <span>{{ $t('dashboard.siteAnnouncement') }}</span>
          </div>
          <div class="notice-nav-mini">
            <button @click="prevNotice" :disabled="currentNoticeIndex <= 0"><IconChevronLeft :size="14"/></button>
            <span class="notice-count">{{ currentNoticeIndex + 1 }}/{{ notices.data.length }}</span>
            <button @click="nextNotice" :disabled="currentNoticeIndex >= notices.data.length - 1"><IconChevronRight :size="14"/></button>
          </div>
        </div>
        <div class="notice-body" @click="showNoticeModal">
          <transition name="fade-slide" mode="out-in">
            <div class="notice-text" :key="currentNoticeIndex">
              <strong>{{ notices.data[currentNoticeIndex].title }}</strong>
              <span class="notice-date">{{ formatDate(notices.data[currentNoticeIndex].created_at) }}</span>
            </div>
          </transition>
        </div>
      </div>

      <!-- 主内容区：双栏布局 -->
      <div class="main-content-grid">
        
        <!-- 左栏：套餐信息和操作 -->
        <div class="left-column">
          
          <!-- 待处理事项 - 紧凑横条 -->
          <div v-if="hasPendingItems" class="pending-bar" :class="{'card-animate': !loading.userStats}">
            <div v-if="userStats.pendingOrders > 0" class="pending-tag" @click="router.push('/orders')">
              <IconShoppingCart :size="16"/>
              <span>{{ userStats.pendingOrders }} {{ $t('dashboard.pendingOrders') }}</span>
              <IconChevronRight :size="14"/>
            </div>
            <div v-if="userStats.pendingTickets > 0" class="pending-tag" @click="goToSupport">
              <IconMessage :size="16"/>
              <span>{{ userStats.pendingTickets }} {{ $t('dashboard.pendingTickets') }}</span>
              <IconChevronRight :size="14"/>
            </div>
          </div>

          <!-- 套餐信息卡片 - 重新设计 -->
          <div v-if="hasPlan" class="plan-card clickable" :class="{'card-animate': !loading.userInfo}" @click="toggleImportCard">
            <div class="plan-header">
              <div class="plan-name-badge">
                <IconBox :size="20"/>
                <span>{{ userPlan.name || $t('dashboard.noSubscription') }}</span>
              </div>
              <div class="plan-status" :class="{'expired': isExpired, 'expiring': isExpiringSoon && !isExpired}">
                {{ isExpired ? $t('dashboard.expired') : (isExpiringSoon ? $t('dashboard.expiringSoon') : $t('dashboard.active')) }}
              </div>
            </div>
            
            <div class="plan-details">
              <div class="detail-row">
                <span class="detail-label"><IconCalendar :size="14"/> {{ $t('dashboard.expiryDate') }}</span>
                <span class="detail-value">{{ userPlan.isExpireDatePermanent ? $t('dashboard.permanent') : (userPlan.expireDate || $t('dashboard.none')) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label"><IconTransferVertical :size="14"/> {{ $t('dashboard.planTraffic') }}</span>
                <span class="detail-value">{{ userPlan.totalTraffic || '0 GB' }}</span>
              </div>
              <div class="detail-row" v-if="userPlan.resetDay">
                <span class="detail-label"><IconRefresh :size="14"/> {{ $t('dashboard.nextResetTime') }}</span>
                <span class="detail-value">{{ userPlan.resetDay }} {{ $t('dashboard.days') }}</span>
              </div>
              <div class="detail-row" v-if="showDeviceLimit">
                <span class="detail-label"><IconDeviceDesktop :size="14"/> {{ $t('dashboard.deviceLimit') }}</span>
                <span class="detail-value">{{ userPlan.deviceLimit === null ? `${userPlan.aliveIp} / ${$t('dashboard.unlimited')}` : `${userPlan.aliveIp} / ${userPlan.deviceLimit}` }}</span>
              </div>
            </div>

            <div class="plan-actions" @click.stop>
              <!-- 试用套餐：正常使用中 - 显示"立即试用"按钮 -->
              <button v-if="isTrialPlan && !isTrialInvalid" class="action-btn primary" :class="{'btn-active': showImportCard}" @click="toggleImportCard">
                <IconShare :size="18"/>
                <span>{{ $t('dashboard.startTrial') }}</span>
              </button>
              
              <!-- 试用套餐：过期或流量用尽 - 显示"购买套餐"按钮 -->
              <button v-if="isTrialPlan && isTrialInvalid" class="action-btn danger" @click="goToShop">
                <IconShoppingCart :size="18"/>
                <span>{{ $t('dashboard.purchasePlan') }}</span>
              </button>
              
              <!-- 正常套餐/长期套餐：未过期 - 显示"导入订阅"按钮 -->
              <button v-if="!isTrialPlan && !isExpired && showImportSubscription" class="action-btn primary" :class="{'btn-active': showImportCard}" @click="toggleImportCard">
                <IconShare :size="18"/>
                <span>{{ $t('dashboard.importSubscription') }}</span>
              </button>
              
              <!-- 正常套餐：已过期 - 显示"续费套餐"按钮 -->
              <button v-if="isNormalPlan && isExpired" class="action-btn danger" @click="renewPlan">
                <IconShoppingCart :size="18"/>
                <span>{{ $t('dashboard.renewPlan') }}</span>
              </button>
              
              <!-- 正常套餐：临近到期（未过期）- 显示"升级套餐"按钮 -->
              <!-- 正常套餐/长期套餐：流量超过80%（未过期）- 显示"升级套餐"按钮 -->
              <button v-if="!isTrialPlan && !isExpired && (isExpiringSoon || isTrafficOver80)" class="action-btn" @click="goToShop">
                <IconTrendingUp :size="18"/>
                <span>{{ $t('dashboard.upgradePlan') }}</span>
              </button>
              
              <!-- 正常套餐/长期套餐：流量超过80%（未过期）- 显示"重置流量"按钮 -->
              <button v-if="!isTrialPlan && !isExpired && isTrafficOver80" class="action-btn" :class="{'warning': !isTrafficDepleted, 'danger': isTrafficDepleted}" @click="openResetTrafficModal">
                <IconRefresh :size="18"/>
                <span>{{ $t('dashboard.resetTraffic') }}</span>
              </button>
              
              <button v-if="allowNewPeriod==='1'&&!isTrialPlan && !isExpired && isTrafficOver80" class="action-btn" @click="showPopup=true">
                <IconCalendarPlus :size="18"/>
              </button>
              <button class="action-btn support-btn" @click="goToSupport" :title="$t('dashboard.ticketSupport')">
                <IconMessage :size="18"/>
                <span class="btn-text-mobile">{{ $t('dashboard.ticketSupport') }}</span>
              </button>
              <button class="action-btn" @click="openDocumentation" :title="$t('dashboard.documentation')">
                <IconFileText :size="18"/>
                <span class="btn-text-mobile">{{ $t('dashboard.documentation') }}</span>
              </button>
            </div>
          </div>

          <!-- 无套餐提示 -->
          <div v-else-if="!loading.userInfo" class="no-plan-card" :class="{'card-animate': !loading.userStats}">
            <div class="no-plan-visual">
              <div class="pulse-ring"></div>
              <div class="pulse-ring delay-1"></div>
              <div class="pulse-ring delay-2"></div>
              <IconRocket :size="40" class="rocket-icon"/>
            </div>
            <div class="no-plan-text">
              <h3>{{ $t('dashboard.noPlanPrompt') }}</h3>
              <p>{{ $t('dashboard.welcomeDesc') }}</p>
            </div>
            <div class="no-plan-actions">
              <button class="cta-btn primary" @click="goToShop">
                <IconShoppingBag :size="20"/>
                <span>{{ $t('dashboard.purchasePlan') }}</span>
              </button>
              <button class="cta-btn secondary" @click="goToSupport">
                <IconMessage :size="20"/>
                <span>{{ $t('dashboard.ticketSupport') }}</span>
              </button>
            </div>
          </div>

          <!-- 订阅导入卡片 -->
          <transition name="slide-fade">
            <div v-if="showImportCard && userPlan.subscribeUrl" class="import-panel">
              <div class="import-header">
                <h3>{{ $t('dashboard.importSubscription') }}</h3>
                <button class="close-btn" @click="showImportCard = false">
                  <IconX :size="18"/>
                </button>
              </div>

              <!-- 订阅链接显示框 -->
              <div class="subscribe-url-box">
                <label class="url-label">{{ $t('dashboard.subscribeUrl') }}</label>
                <div class="url-input-wrap">
                  <input 
                    type="text" 
                    :value="userPlan.subscribeUrl" 
                    readonly 
                    class="url-input"
                    @focus="$event.target.select()"
                  />
                </div>
                <p class="url-hint">{{ $t('dashboard.subscribeUrlHint') }}</p>
              </div>
              
              <div class="quick-actions">
                <button class="quick-btn" @click="copySubscription">
                  <IconCopy :size="20"/>
                  <span>{{ $t('dashboard.copySubscription') }}</span>
                </button>
                <button class="quick-btn" @click="handleShowQrCode">
                  <IconQrcode :size="20"/>
                  <span>{{ $t('dashboard.scanQRCode') }}</span>
                </button>
              </div>

              <!-- 平台选择器 -->
              <div class="platform-selector">
                <button
                    v-for="platform in platforms"
                    :key="platform.id"
                    class="platform-button"
                    :class="{ 'active': activePlatform === platform.id }"
                    @click="activePlatform = platform.id"
                >
                  <component :is="platform.icon" :size="16"/>
                  <span>{{ $t(`platforms.${platform.id}`) }}</span>
                </button>
              </div>

              <!-- iOS平台选项 -->
              <div v-if="activePlatform === 'ios'" class="platform-section">
                <div v-if="hasIOSClients" class="platform-options">
                  <div v-if="clientConfig.showShadowrocket" class="platform-option" @click="importToClient('shadowrocket')">
                    <img :src="shadowrocketIcon" class="client-icon" alt="Shadowrocket"/>
                    <span>Shadowrocket</span>
                  </div>
                  <div v-if="clientConfig.showSurge" class="platform-option" @click="importToClient('surge')">
                    <img :src="surgeIcon" class="client-icon" alt="Surge"/>
                    <span>Surge</span>
                  </div>
                  <div v-if="clientConfig.showStash" class="platform-option" @click="importToClient('stash')">
                    <img :src="stashIcon" class="client-icon" alt="Stash"/>
                    <span>Stash</span>
                  </div>
                  <div v-if="clientConfig.showQuantumultX" class="platform-option" @click="importToClient('quantumultx')">
                    <img :src="quantumultIcon" class="client-icon" alt="Quantumult X"/>
                    <span>Quantumult X</span>
                  </div>
                  <div v-if="clientConfig.showHiddifyIOS" class="platform-option" @click="importToClient('hiddify-ios')">
                    <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                    <span>Hiddify</span>
                  </div>
                  <div v-if="clientConfig.showSingboxIOS" class="platform-option" @click="importToClient('singbox-ios')">
                    <img :src="singboxIcon" class="client-icon" alt="Singbox"/>
                    <span>Singbox</span>
                  </div>
                  <div v-if="clientConfig.showLoon" class="platform-option" @click="importToClient('loon')">
                    <img :src="loonIcon" class="client-icon" alt="Loon"/>
                    <span>Loon</span>
                  </div>
                </div>
                <div v-else class="no-clients-message">
                  <p>{{ $t('dashboard.noClientsAvailable') }}</p>
                </div>
              </div>

              <!-- Android平台选项 -->
              <div v-if="activePlatform === 'android'" class="platform-section">
                <div v-if="hasAndroidClients" class="platform-options">
                  <div v-if="clientConfig.showFlClashAndroid" class="platform-option" @click="importToClient('flclash')">
                    <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                    <span>FlClash</span>
                  </div>
                  <div v-if="clientConfig.showV2rayNG" class="platform-option" @click="importToClient('v2rayng')">
                    <img :src="v2rayNGIcon" class="client-icon" alt="V2rayNG"/>
                    <span>V2rayNG</span>
                  </div>
                  <div v-if="clientConfig.showClashAndroid" class="platform-option" @click="importToClient('clash-android')">
                    <img :src="clashAndroidIcon" class="client-icon" alt="Clash"/>
                    <span>Clash</span>
                  </div>
                  <div v-if="clientConfig.showSurfboard" class="platform-option" @click="importToClient('surfboard')">
                    <img :src="surfboardIcon" class="client-icon" alt="Surfboard"/>
                    <span>Surfboard</span>
                  </div>
                  <div v-if="clientConfig.showClashMetaAndroid" class="platform-option" @click="importToClient('clash-meta-android')">
                    <img :src="clashMetaAndroidIcon" class="client-icon" alt="Clash Meta"/>
                    <span>Clash Meta</span>
                  </div>
                  <div v-if="clientConfig.showNekobox" class="platform-option" @click="importToClient('nekobox')">
                    <img :src="nekoboxIcon" class="client-icon" alt="Nekobox"/>
                    <span>Nekobox</span>
                  </div>
                  <div v-if="clientConfig.showSingboxAndroid" class="platform-option" @click="importToClient('singbox-android')">
                    <img :src="singboxAndroidIcon" class="client-icon" alt="Singbox"/>
                    <span>Singbox</span>
                  </div>
                  <div v-if="clientConfig.showHiddifyAndroid" class="platform-option" @click="importToClient('hiddify-android')">
                    <img :src="hiddifyAndroidIcon" class="client-icon" alt="Hiddify"/>
                    <span>Hiddify</span>
                  </div>
                </div>
                <div v-else class="no-clients-message">
                  <p>{{ $t('dashboard.noClientsAvailable') }}</p>
                </div>
              </div>

              <!-- Windows平台选项 -->
              <div v-if="activePlatform === 'windows'" class="platform-section">
                <div v-if="hasWindowsClients" class="platform-options">
                  <div v-if="clientConfig.showFlClashWindows" class="platform-option" @click="importToClient('flclash')">
                    <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                    <span>FlClash</span>
                  </div>
                  <div v-if="clientConfig.showClashVergeWindows" class="platform-option" @click="importToClient('clashverge')">
                    <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                    <span>ClashVerge</span>
                  </div>
                  <div v-if="clientConfig.showClashWindows" class="platform-option" @click="importToClient('clash')">
                    <img :src="clashWindowsIcon" class="client-icon" alt="Clash"/>
                    <span>Clash</span>
                  </div>
                  <div v-if="clientConfig.showNekoray" class="platform-option" @click="importToClient('nekoray')">
                    <img :src="nekorayIcon" class="client-icon" alt="Nekoray"/>
                    <span>Nekoray</span>
                  </div>
                  <div v-if="clientConfig.showSingboxWindows" class="platform-option" @click="importToClient('singbox-windows')">
                    <img :src="singboxWindowsIcon" class="client-icon" alt="Singbox"/>
                    <span>Singbox</span>
                  </div>
                  <div v-if="clientConfig.showHiddifyWindows" class="platform-option" @click="importToClient('hiddify-windows')">
                    <img :src="hiddifyWindowsIcon" class="client-icon" alt="Hiddify"/>
                    <span>Hiddify</span>
                  </div>
                </div>
                <div v-else class="no-clients-message">
                  <p>{{ $t('dashboard.noClientsAvailable') }}</p>
                </div>
              </div>

              <!-- MacOS平台选项 -->
              <div v-if="activePlatform === 'macos'" class="platform-section">
                <div v-if="hasMacOSClients" class="platform-options">
                  <div v-if="clientConfig.showFlClashMac" class="platform-option" @click="importToClient('flclash')">
                    <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                    <span>FlClash</span>
                  </div>
                  <div v-if="clientConfig.showClashVergeMac" class="platform-option" @click="importToClient('clashverge')">
                    <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                    <span>ClashVerge</span>
                  </div>
                  <div v-if="clientConfig.showClashX" class="platform-option" @click="importToClient('clashx')">
                    <img :src="clashXIcon" class="client-icon" alt="ClashX"/>
                    <span>ClashX</span>
                  </div>
                  <div v-if="clientConfig.showClashMetaX" class="platform-option" @click="importToClient('clashx-meta')">
                    <img :src="clashMetaXIcon" class="client-icon" alt="ClashX Meta"/>
                    <span>ClashX Meta</span>
                  </div>
                  <div v-if="clientConfig.showSurgeMac" class="platform-option" @click="importToClient('surge-mac')">
                    <img :src="surgeMacIcon" class="client-icon" alt="Surge"/>
                    <span>Surge</span>
                  </div>
                  <div v-if="clientConfig.showStashMac" class="platform-option" @click="importToClient('stash-mac')">
                    <img :src="stashMacIcon" class="client-icon" alt="Stash"/>
                    <span>Stash</span>
                  </div>
                  <div v-if="clientConfig.showQuantumultXMac" class="platform-option" @click="importToClient('quantumultx-mac')">
                    <img :src="quantumultXMacIcon" class="client-icon" alt="Quantumult X"/>
                    <span>Quantumult X</span>
                  </div>
                  <div v-if="clientConfig.showSingboxMac" class="platform-option" @click="importToClient('singbox-macos')">
                    <img :src="singboxMacIcon" class="client-icon" alt="Singbox"/>
                    <span>Singbox</span>
                  </div>
                  <div v-if="clientConfig.showHiddifyMac" class="platform-option" @click="importToClient('hiddify-macos')">
                    <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                    <span>Hiddify</span>
                  </div>
                </div>
                <div v-else class="no-clients-message">
                  <p>{{ $t('dashboard.noClientsAvailable') }}</p>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 右栏：公告和下载 -->
        <div class="right-column">
          
          <!-- 公告卡片 - 紧凑设计 (桌面端显示) -->
          <div class="notice-compact desktop-only" v-if="notices && notices.data && notices.data.length > 0" :class="{'card-animate': !loading.notices}">
            <div class="notice-header">
              <div class="notice-title-row">
                <IconBell :size="18"/>
                <span>{{ $t('dashboard.siteAnnouncement') }}</span>
              </div>
              <div class="notice-nav-mini">
                <button @click="prevNotice" :disabled="currentNoticeIndex <= 0"><IconChevronLeft :size="14"/></button>
                <span class="notice-count">{{ currentNoticeIndex + 1 }}/{{ notices.data.length }}</span>
                <button @click="nextNotice" :disabled="currentNoticeIndex >= notices.data.length - 1"><IconChevronRight :size="14"/></button>
              </div>
            </div>
            <div class="notice-body" @click="showNoticeModal">
              <transition name="fade-slide" mode="out-in">
                <div class="notice-text" :key="currentNoticeIndex">
                  <strong>{{ notices.data[currentNoticeIndex].title }}</strong>
                  <span class="notice-date">{{ formatDate(notices.data[currentNoticeIndex].created_at) }}</span>
                </div>
              </transition>
            </div>
          </div>

          <!-- 官方客户端下载 - 紧凑设计 -->
          <div class="download-compact" v-if="clientConfig.showDownloadCard" :class="{'card-animate': !loading.userInfo}">
            <div class="download-header">
              <IconDownload :size="18"/>
              <span>{{ $t('dashboard.officialClients') }}</span>
            </div>
            <div class="download-grid">
              <div class="download-item" v-if="clientConfig.showIOS" @click="downloadClient('ios')">
                <IconBrandApple :size="24"/>
                <span>iOS</span>
              </div>
              <div class="download-item" v-if="clientConfig.showAndroid" @click="downloadClient('android')">
                <IconBrandAndroid :size="24"/>
                <span>Android</span>
              </div>
              <div class="download-item" v-if="clientConfig.showMacOS" @click="downloadClient('macos')">
                <IconBrandFinder :size="24"/>
                <span>Mac</span>
              </div>
              <div class="download-item" v-if="clientConfig.showWindows" @click="downloadClient('windows')">
                <IconBrandWindows :size="24"/>
                <span>Win</span>
              </div>
              <div class="download-item" v-if="clientConfig.showLinux" @click="downloadClient('linux')">
                <IconBrandDebian :size="24"/>
                <span>Linux</span>
              </div>
              <div class="download-item" v-if="clientConfig.showOpenWrt" @click="downloadClient('openwrt')">
                <IconRouter :size="24"/>
                <span>Router</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- QR码模态窗口 -->
      <transition name="fade">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>{{ $t('dashboard.scanQRCode') }}</h3>
              <button class="close-btn" @click="showQrCode = false">
                <span class="close-icon"></span>
              </button>
            </div>
            <div class="qrcode-content">
              <div v-if="qrCodeLoading" class="qrcode-loading">
                <div class="loading-spinner"></div>
                <p>{{ $t('common.loadingQRCode') }}</p>
              </div>
              <img v-else :src="qrCodeUrl" alt="QR Code" @load="qrCodeLoaded"/>
            </div>
          </div>
        </div>
      </transition>

      <!-- 公告弹窗 -->
      <transition name="fade">
        <div v-if="showNoticeDetails" class="notice-modal-overlay" @click="closeNoticeModal">
          <transition name="popup-slide">
            <div v-if="showNoticeDetails" class="notice-modal" :style="noticeModalStyle" @click.stop>
              <div class="notice-modal-header">
                <h2 class="popup-title">{{ notices.data[currentNoticeIndex].title }}</h2>
                <button class="popup-close-btn" @click="closeNoticeModal">
                  <IconX :size="20"/>
                </button>
              </div>
              <div class="notice-modal-content">
                <div v-html="processedNoticeContent" class="notice-content"></div>
              </div>
              <div class="notice-modal-footer">
                <button class="popup-action-btn adaptive-btn" @click="closeNoticeModal">
                  {{ $t('common.close') }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

    </div>
    
    <!-- 弹窗组件 -->
    <CommonDialog
        :show-dialog="showPopup"
        :title="$t('invite.withdraw.tip')"
        :content="$t('dashboard.resetDataCycleNotice')"
        cancel-button-i18n-key="profile.cancel"
        confirm-button-i18n-key="profile.iKnow"
        @close="handlePopupClose"
        @confirm="handlePopupConfirm"
    />
  </div>

  <!-- 重置流量确认弹窗 -->
  <transition name="modal-fade">
    <div class="modal-overlay" v-if="showResetTrafficModal">
      <div class="modal-container">
        <div class="modal-card reset-traffic-modal">
          <div class="modal-header">
            <h3>{{ $t('dashboard.resetTrafficConfirm') }}</h3>
            <button class="close-button" @click="closeResetTrafficModal">×</button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <IconAlertTriangle :size="48"/>
            </div>
            <p class="warning-text">{{ $t('dashboard.resetTrafficDesc') }}</p>
            <p class="note-text">{{ $t('dashboard.resetTrafficWarning') }}</p>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeResetTrafficModal">
              {{ $t('common.cancel') }}
            </button>
            <button
                class="confirm-btn"
                :disabled="resetConfirmCooldown > 0 || isCreatingResetOrder"
                @click="createResetTrafficOrder"
            >
              <template v-if="isCreatingResetOrder">
                <span class="loading-container">
                  <div class="loader-small"></div>
                  <span>{{ $t('common.loading') }}</span>
                </span>
              </template>
              <template v-else>
                {{ resetConfirmCooldown > 0 ? `${$t('common.confirm')} (${resetConfirmCooldown})` : $t('common.confirm') }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

</template>

<script>
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {CLIENT_CONFIG, DASHBOARD_CONFIG, isXiaoV2board, SITE_CONFIG} from '@/utils/baseConfig';
import {
  IconAlertTriangle,
  IconBell,
  IconBox,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandDebian,
  IconBrandFinder,
  IconBrandGithub,
  IconBrandWindows,
  IconCalendar,
  IconCat,
  IconChevronLeft,
  IconChevronRight,
  IconCoins,
  IconCopy,
  IconCrosshair,
  IconDeviceDesktop,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconHelpCircle,
  IconMail,
  IconMessage,
  IconMoon,
  IconPackage,
  IconPlayerPause,
  IconPlayerPlay,
  IconQrcode,
  IconRefresh,
  IconRocket,
  IconRouter,
  IconSend,
  IconShare,
  IconShoppingBag,
  IconShoppingCart,
  IconTransferVertical,
  IconTrendingUp,
  IconUserPlus,
  IconWallet,
  IconWaveSawTool,
  IconWaveSine,
  IconX,
  IconCalendarPlus,
  IconGift
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import {getNotices, getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/dashboard';
import {getInviteData} from '@/api/invite';
import {useToast} from '@/composables/useToast';
import {submitOrder} from '@/api/shop';
import MarkdownIt from 'markdown-it';
import QRCode from 'qrcode';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import surgeIconImg from '@/assets/images/client-img-ios/Surge.png';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import quantumultIconImg from '@/assets/images/client-img-ios/quantumultx.png';
import singboxIconImg from '@/assets/images/client-img-ios/singbox.png';
import loonIconImg from '@/assets/images/client-img-ios/loon.png';
import v2rayNGIconImg from '@/assets/images/client-img-android/v2rayng.png';
import clashAndroidIconImg from '@/assets/images/client-img-android/clash.png';
import surfboardIconImg from '@/assets/images/client-img-android/surfboard.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import nekoboxIconImg from '@/assets/images/client-img-android/nekobox.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import hiddifyAndroidIconImg from '@/assets/images/client-img-android/hiddify.png';
import flclashIconImg from '@/assets/images/client-img-windows/flclash.png';
import clashvergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import clashWindowsIconImg from '@/assets/images/client-img-windows/clash.png';
import nekorayIconImg from '@/assets/images/client-img-windows/nekoray.png';
import singboxWindowsIconImg from '@/assets/images/client-img-windows/singbox.png';
import hiddifyWindowsIconImg from '@/assets/images/client-img-windows/hiddify.png';
import clashXIconImg from '@/assets/images/client-img-macos/clashx.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import surgeMacIconImg from '@/assets/images/client-img-macos/Surge.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import quantumultXMacIconImg from '@/assets/images/client-img-macos/quantumultx.png';
import singboxMacIconImg from '@/assets/images/client-img-macos/singbox.png';
import hiddifyMacIconImg from '@/assets/images/client-img-macos/hiddify.png';

import {cleanupResources, createTimer} from '@/utils/componentLifecycle';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex('href');
  let href = '';

  if (hrefIndex >= 0) {
    href = token.attrs[hrefIndex][1];
  }

  if (href.includes('#eztheme-btn') || href.includes('class=eztheme-btn') || href.includes('?eztheme-btn')) {
    token.attrs[hrefIndex][1] = href
        .replace('#eztheme-btn', '')
        .replace('class=eztheme-btn', '')
        .replace('?eztheme-btn', '');

    const classIndex = token.attrIndex('class');
    if (classIndex < 0) {
      token.attrPush(['class', 'eztheme-btn']);
    } else {
      const classes = token.attrs[classIndex][1];
      if (!classes.includes('eztheme-btn')) {
        token.attrs[classIndex][1] = classes + ' eztheme-btn';
      }
    }
  }

  return self.renderToken(tokens, idx, options);
};

export default {
  name: 'UserDashboard',
  components: {
    IconBell,
    IconBox,
    IconDownload,
    IconSend,
    IconCalendar,
    IconUserPlus,
    IconShoppingCart,
    IconFileText,
    IconWallet,
    IconBrandApple,
    IconBrandAndroid,
    IconBrandWindows,
    IconBrandDebian,
    IconRouter,
    IconBrandFinder,
    IconChevronRight,
    IconTransferVertical,
    IconShare,
    IconMessage,
    IconMail,
    IconChevronLeft,
    IconCopy,
    IconQrcode,
    IconRocket,
    IconWaveSine,
    IconDeviceDesktop,
    IconCrosshair,
    IconPackage,
    IconMoon,
    IconWaveSawTool,
    IconBrandGithub,
    IconCat,
    IconEyeOff,
    IconShoppingBag,
    IconHelpCircle,
    IconCoins,
    IconEye,
    IconRefresh,
    IconAlertTriangle,
    IconX,
    IconCalendarPlus,
    IconPlayerPause,
    IconPlayerPlay,
    IconGift,
    IconTrendingUp,
    CommonDialog
  },
  setup() {
    const {t, locale} = useI18n();
    const router = useRouter();
    const clientConfig = reactive(CLIENT_CONFIG);
    const notices = ref([]);
    const autoRotateNotices = ref(true);
    const userPlan = ref({
      deviceLimit: null,
      aliveIp: 0,
      resetDay: null
    });
    const qrCodeLoading = ref(true);
    const showImportSubscription = ref(DASHBOARD_CONFIG.showImportSubscription)

    const languageChangedSignal = inject('languageChangedSignal', ref(0));

    const shadowrocketIcon = shadowrocketIconImg;
    const surgeIcon = surgeIconImg;
    const stashIcon = stashIconImg;
    const quantumultIcon = quantumultIconImg;
    const singboxIcon = singboxIconImg;
    const loonIcon = loonIconImg;

    const v2rayNGIcon = v2rayNGIconImg;
    const clashAndroidIcon = clashAndroidIconImg;
    const surfboardIcon = surfboardIconImg;
    const clashMetaAndroidIcon = clashMetaAndroidIconImg;
    const nekoboxIcon = nekoboxIconImg;
    const singboxAndroidIcon = singboxAndroidIconImg;
    const hiddifyAndroidIcon = hiddifyAndroidIconImg;

    const flclashIcon = flclashIconImg;
    const clashvergeIcon = clashvergeIconImg;
    const clashWindowsIcon = clashWindowsIconImg;
    const nekorayIcon = nekorayIconImg;
    const singboxWindowsIcon = singboxWindowsIconImg;
    const hiddifyWindowsIcon = hiddifyWindowsIconImg;

    const clashXIcon = clashXIconImg;
    const clashMetaXIcon = clashMetaXIconImg;
    const surgeMacIcon = surgeMacIconImg;
    const stashMacIcon = stashMacIconImg;
    const quantumultXMacIcon = quantumultXMacIconImg;
    const singboxMacIcon = singboxMacIconImg;
    const hiddifyMacIcon = hiddifyMacIconImg;

    const userStats = reactive({
      remainingTraffic: '',
      remainingDays: '',
      accountBalance: '0.00',
      commissionBalance: '0.00',
      pendingOrders: 0,
      pendingTickets: 0,
      userEmail: '',
      isRemainingDaysPermanent: false
    });
    const userBalance = ref('0.00');
    const currencySymbol = ref('$');
    const hasPlan = ref(true);
    const currentNoticeIndex = ref(0);
    const showNoticeDetails = ref(false);
    const showImportCard = ref(false);
    const showQrCode = ref(false);
    const {showToast} = useToast();
    const qrCodeUrl = ref('');

    //提前开启下月
    const allowNewPeriod = ref('')

    const platforms = [
      {id: 'ios', icon: 'IconBrandApple'},
      {id: 'android', icon: 'IconBrandAndroid'},
      {id: 'windows', icon: 'IconBrandWindows'},
      {id: 'macos', icon: 'IconBrandFinder'}
    ];

    const activePlatform = ref(detectUserPlatform());

    function detectUserPlatform() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
      }

      if (/android/i.test(userAgent)) {
        return 'android';
      }

      if (/Mac/.test(userAgent)) {
        return 'macos';
      }

      return 'windows';
    }

    const loading = reactive({
      userInfo: true,
      userStats: true,
      notices: true,
      userPlan: true,
      subscribe: true
    });

    const waterAnimationState = reactive({
      canAnimate: false,
      initialized: false
    });

    watch(() => [loading.userStats, loading.userInfo], ([userStatsLoading, userInfoLoading]) => {
      if (!userStatsLoading && !userInfoLoading) {
        setTimeout(() => {
          waterAnimationState.canAnimate = true;
          waterAnimationState.initialized = true;
        }, 500);
      }
    }, {immediate: false, flush: 'post'});

    watch(() => locale.value, () => {
      if (userPlan.value.isExpireDatePermanent) {
        userPlan.value.expireDate = t('dashboard.permanent');
      }
    });

    const openDocumentation = () => {
      router.push('/docs');
    };

    const downloadClient = (platform) => {
      const downloadUrl = clientConfig.clientLinks[platform];
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    };

    const goToShop = () => {
      router.push('/shop');
    };

    const userPlanId = ref(null);

    const showResetTrafficModal = ref(false);
    const resetConfirmCooldown = ref(0);
    const resetConfirmTimer = ref(null);
    const isCreatingResetOrder = ref(false);

    const openResetTrafficModal = () => {
      showResetTrafficModal.value = true;
      resetConfirmCooldown.value = 3;
      resetConfirmTimer.value = setInterval(() => {
        if (resetConfirmCooldown.value > 0) {
          resetConfirmCooldown.value--;
        } else {
          clearInterval(resetConfirmTimer.value);
        }
      }, 1000);
    };
    const showPopup = ref(false);
    const popupConfig = reactive({

      title: t('invite.withdraw.tip'),

      content: t('dashboard.resetDataCycleNotice'),

      cooldownHours: 0,

      closeWaitSeconds: 0

    });
    const handlePopupClose = () => {

      showPopup.value = false;
      // console.log(showPopup.value,'111111111')
      // nextPeriod()

    };
    const handlePopupConfirm = async () => {
      try {
        const response = await setNextPeriod()
        console.log(response)
        if (response.data) {
          await fetchSubscribe()
          showToast(t('dashboard.nextPeriodSuccess'), 'success');
          showPopup.value = false;
        }
      } catch (error) {
        console.error('提前开启下月失败:', error);
        showToast(t('dashboard.nextPeriodError'), 'error');
      }

    }

    const closeResetTrafficModal = () => {
      showResetTrafficModal.value = false;
      if (resetConfirmTimer.value) {
        clearInterval(resetConfirmTimer.value);
      }
    };

    const createResetTrafficOrder = async () => {
      if (resetConfirmCooldown.value > 0) {
        return;
      }

      console.log('开始请求：设置 isCreatingResetOrder = true');
      isCreatingResetOrder.value = true;

      try {
        if (!userPlanId.value) {
          showToast(t('common.error_occurred'), 'error');
          console.log('无套餐ID：重置 isCreatingResetOrder = false');
          isCreatingResetOrder.value = false;
          return;
        }

        console.log('正在调用API，当前状态：', isCreatingResetOrder.value);
        const response = await submitOrder({
          plan_id: userPlanId.value,
          period: 'reset_price'
        });

        if (response && response.data) {
          console.log('API请求成功');
          showToast(t('dashboard.resetTrafficSuccess'), 'success');

          closeResetTrafficModal();

          router.push({
            path: '/payment',
            query: {
              trade_no: response.data
            }
          });
        }
      } catch (error) {
        console.error('创建重置流量订单失败:', error);
        showToast(error.message || t('common.error_occurred'), 'error');
      } finally {
        console.log('请求结束：重置 isCreatingResetOrder = false');
        isCreatingResetOrder.value = false;
      }
    };

    const fetchUserInfo = async () => {
      if (loading.userInfo === false && Object.keys(userPlan.value).length > 0) return;

      loading.userInfo = true;
      try {
        const response = await getUserInfo();
        if (response.data) {
          const info = response.data;

          userPlanId.value = info.plan_id;

          hasPlan.value = info.plan_id !== null && info.plan_id !== undefined;

          if (info.email) {
            userStats.userEmail = info.email;
          }
          if (info.balance !== undefined) {
            userBalance.value = info.balance;
            updateAccountBalanceDisplay();
          }
          if (info.expired_at) {
            userPlan.value.expireDate = formatDate(info.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(info.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        loading.userInfo = false;
      }
    };

    // 获取佣金余额
    const fetchCommissionBalance = async () => {
      try {
        const res = await getInviteData();
        if (res.data && res.data.stat) {
          userStats.commissionBalance = ((res.data.stat[4] || 0) / 100).toFixed(2);
        }
      } catch (error) {
        console.error('获取佣金余额失败:', error);
      }
    };

    const isExpiringSoon = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days > 0 && days <= DASHBOARD_CONFIG.expiringThreshold;
    });

    const hasIOSClients = computed(() => {
      return clientConfig.showShadowrocket ||
          clientConfig.showSurge ||
          clientConfig.showStash ||
          clientConfig.showQuantumultX ||
          clientConfig.showHiddifyIOS ||
          clientConfig.showSingboxIOS ||
          clientConfig.showLoon;
    });

    const hasAndroidClients = computed(() => {
      return clientConfig.showV2rayNG ||
          clientConfig.showClashAndroid ||
          clientConfig.showSurfboard ||
          clientConfig.showClashMetaAndroid ||
          clientConfig.showNekobox ||
          clientConfig.showSingboxAndroid ||
          clientConfig.showHiddifyAndroid;
    });

    const hasWindowsClients = computed(() => {
      return clientConfig.showClashWindows ||
          clientConfig.showFlClashWindows ||
          clientConfig.showClashVergeWindows ||
          clientConfig.showNekoray ||
          clientConfig.showSingboxWindows ||
          clientConfig.showHiddifyWindows;
    });

    const hasMacOSClients = computed(() => {
      return clientConfig.showClashX ||
          clientConfig.showFlClashMac ||
          clientConfig.showClashVergeMac ||
          clientConfig.showClashMetaX ||
          clientConfig.showSurgeMac ||
          clientConfig.showStashMac ||
          clientConfig.showQuantumultXMac ||
          clientConfig.showSingboxMac ||
          clientConfig.showHiddifyMac;
    });

    const isExpired = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days <= 0;
    });

    const isLowTraffic = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!userPlan.value || !userPlan.value.totalTraffic || !remainingMatch) return false;

      const totalMatch = userPlan.value.totalTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);
      if (!totalMatch) return false;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      const totalValue = parseFloat(totalMatch[1]);
      const totalUnit = totalMatch[3].toUpperCase();

      const unitToBytes = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };

      const remainingBytes = remainingValue * unitToBytes[remainingUnit];
      const totalBytes = totalValue * unitToBytes[totalUnit];

      if (totalBytes === 0) return false;

      if (remainingBytes === 0) return false;

      const percentage = (remainingBytes / totalBytes) * 100;

      return percentage > 0 && percentage <= DASHBOARD_CONFIG.lowTrafficThreshold;
    });

    const isTrafficDepleted = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!remainingMatch) return false;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      if (remainingValue === 0) return true;
      if (remainingUnit === 'B' && remainingValue < 10) return true;
      if (remainingUnit === 'KB' && remainingValue < 0.01) return true;

      return false;
    });

    // 是否为试用套餐 (plan_id === 1)
    const isTrialPlan = computed(() => {
      return userPlanId.value === 1;
    });

    // 是否为长期/永久套餐 (没有过期时间)
    const isLongTermPlan = computed(() => {
      return userStats.isRemainingDaysPermanent;
    });

    // 是否为正常套餐 (非试用、非长期)
    const isNormalPlan = computed(() => {
      return !isTrialPlan.value && !isLongTermPlan.value;
    });

    // 流量使用是否超过80%
    const isTrafficOver80 = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!userPlan.value || !userPlan.value.totalTraffic || !remainingMatch) return false;

      const totalMatch = userPlan.value.totalTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);
      if (!totalMatch) return false;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      const totalValue = parseFloat(totalMatch[1]);
      const totalUnit = totalMatch[3].toUpperCase();

      const unitToBytes = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };

      const remainingBytes = remainingValue * unitToBytes[remainingUnit];
      const totalBytes = totalValue * unitToBytes[totalUnit];

      if (totalBytes === 0) return false;

      // 剩余流量百分比
      const remainingPercentage = (remainingBytes / totalBytes) * 100;
      // 已使用流量超过80%，即剩余流量少于20%
      return remainingPercentage <= 20;
    });

    // 试用套餐是否失效（过期或流量用尽）
    const isTrialInvalid = computed(() => {
      return isTrialPlan.value && (isExpired.value || isTrafficDepleted.value);
    });

    const showResetTrafficButton = computed(() => {
      if (!DASHBOARD_CONFIG.enableResetTraffic) return false;

      switch (DASHBOARD_CONFIG.resetTrafficDisplayMode) {
        case 'always':
          return true;
        case 'low':
          return isLowTraffic.value || isTrafficDepleted.value;
        case 'depleted':
          return isTrafficDepleted.value;
        default:
          return false;
      }
    });

    const showRenewPlanButton = computed(() => {
      if (!DASHBOARD_CONFIG.enableRenewPlan) return false;


      switch (DASHBOARD_CONFIG.renewPlanDisplayMode) {
        case 'always':
          return true;
        case 'expiring':
          return isExpiringSoon.value;
        case 'expired':
          return isExpired.value;
        default:
          return false;
      }
    });


    const fetchSubscribe = async () => {
      // 如果showResetTrafficButton为true，强制执行（跳过缓存逻辑）
      // if (showResetTrafficButton.value) {
      //   // 强制执行，但仍要防止并发
      //   if (loading.subscribe === true) return;
      // } else {
      // 正常的缓存逻辑
      if (loading.subscribe === false && userPlan.value.subscribeUrl) return;
      // }

      loading.subscribe = true;
      try {
        const response = await getSubscribe();
        allowNewPeriod.value = response.data.allow_new_period;
        if (response.data) {
          const subscribe = response.data;
          if (subscribe.plan && subscribe.plan.name) {
            userPlan.value.name = subscribe.plan.name;
          }
          if (subscribe.plan && subscribe.plan.id) {
            userPlanId.value = subscribe.plan.id;
          }
          if (subscribe.expired_at) {
            userPlan.value.expireDate = formatDate(subscribe.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
          if (subscribe.transfer_enable) {
            userPlan.value.totalTraffic = formatTraffic(subscribe.transfer_enable);
          }
          if (subscribe.transfer_enable && subscribe.u !== undefined && subscribe.d !== undefined) {
            const usedTraffic = subscribe.u + subscribe.d;
            const remainingTraffic = Math.max(0, subscribe.transfer_enable - usedTraffic);
            userStats.remainingTraffic = formatTraffic(remainingTraffic);
          }
          if (subscribe.reset_day) {
            userPlan.value.resetDay = subscribe.reset_day;
          }
          if (subscribe.subscribe_url) {
            userPlan.value.subscribeUrl = subscribe.subscribe_url;
          }

          if (subscribe.device_limit !== undefined) {
            userPlan.value.deviceLimit = subscribe.device_limit;
          }
          if (subscribe.alive_ip !== undefined) {
            userPlan.value.aliveIp = subscribe.alive_ip;
          }

          if (subscribe.expired_at) {
            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
      } finally {
        loading.subscribe = false;
      }
    };

    const fetchNotices = async () => {
      if (loading.notices === false && notices.value.data && notices.value.data.length > 0) return;

      loading.notices = true;
      try {
        const response = await getNotices();
        if (response && response.data) {
          notices.value = response;

          checkForPopupNotices();
        }
      } catch (error) {
      } finally {
        loading.notices = false;
      }
    };

    const checkForPopupNotices = () => {
      if (!notices.value || !notices.value.data || notices.value.data.length === 0) return;

      // 首先查找带有"弹窗"标签的公告
      const popupNoticeIndex = notices.value.data.findIndex(notice =>
          notice.tags && Array.isArray(notice.tags) && notice.tags.includes('\u5f39\u7a97')
      );

      let targetNoticeIndex = -1;
      let noticeId = null;

      if (popupNoticeIndex !== -1) {
        // 如果找到带"弹窗"标签的公告，使用它
        targetNoticeIndex = popupNoticeIndex;
        noticeId = notices.value.data[popupNoticeIndex].id;
      } else if (notices.value.data.length > 0) {
        // 否则默认使用第一条公告
        targetNoticeIndex = 0;
        noticeId = notices.value.data[0].id;
      }

      if (targetNoticeIndex !== -1 && noticeId) {
        const popupShownKey = `popup_notice_shown_${noticeId}`;

        if (!sessionStorage.getItem(popupShownKey)) {
          currentNoticeIndex.value = targetNoticeIndex;
          showNoticeDetails.value = true;
          sessionStorage.setItem(popupShownKey, 'true');
          // 打开弹窗时暂停轮播
          if (autoRotateNotices.value) {
            cleanupResources(timers, {});
          }
          nextTick(() => {
            updateModalHeight();
          });
        }
      }
    };

    const fetchUserStats = async () => {
      if (loading.userStats === false && userStats.remainingTraffic !== '0 GB') return;

      loading.userStats = true;
      try {
        const response = await getUserStats();
        if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
          const stats = response.data;
          userStats.pendingOrders = stats[0];
          userStats.pendingTickets = stats[1];
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        loading.userStats = false;
      }
    };

    const formatTraffic = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasPendingItems = computed(() => {
      return userStats.pendingOrders > 0 || userStats.pendingTickets > 0;
    });

    const prevNotice = () => {
      if (currentNoticeIndex.value > 0) {
        currentNoticeIndex.value--;
        resetAutoRotateTimer();
      }
    };

    const nextNotice = () => {
      if (currentNoticeIndex.value < notices.value.data.length - 1) {
        currentNoticeIndex.value++;
      } else {
        // 循环到第一条
        currentNoticeIndex.value = 0;
      }
      resetAutoRotateTimer();
    };

    const goToNotice = (index) => {
      currentNoticeIndex.value = index;
      resetAutoRotateTimer();
    };

    const toggleAutoRotate = () => {
      autoRotateNotices.value = !autoRotateNotices.value;
      if (autoRotateNotices.value) {
        startAutoRotateNotices();
      } else {
        cleanupResources(timers, {});
      }
    };

    const resetAutoRotateTimer = () => {
      if (autoRotateNotices.value) {
        cleanupResources(timers, {});
        startAutoRotateNotices();
      }
    };

    const showNoticeModal = () => {
      showNoticeDetails.value = true;
      // 打开弹窗时暂停轮播
      if (autoRotateNotices.value) {
        cleanupResources(timers, {});
      }
      nextTick(() => {
        updateModalHeight();
      });
    };

    const closeNoticeModal = () => {
      showNoticeDetails.value = false;
      // 关闭弹窗时恢复轮播
      if (autoRotateNotices.value) {
        startAutoRotateNotices();
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString * 1000);
      return date.toLocaleDateString();
    };

    const updateQRCodeUrl = () => {
      if (userPlan.value.subscribeUrl) {
        qrCodeLoading.value = true;
        try {
          QRCode.toDataURL(userPlan.value.subscribeUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
              .then(url => {
                qrCodeUrl.value = url;
                qrCodeLoading.value = false;
              })
              .catch(err => {
                console.error('二维码生成失败:', err);
                qrCodeLoading.value = false;
                showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
              });
        } catch (error) {
          console.error('生成二维码失败:', error);
          qrCodeLoading.value = false;
          showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
        }
      }
    };

    const qrCodeLoaded = () => {
      qrCodeLoading.value = false;
    };

    const handleShowQrCode = () => {
      // 检查订阅是否过期
      if (isExpired.value) {
        showToast(t('dashboard.subscriptionExpiredDesc'), 'error', 4000);
        return;
      }
      showQrCode.value = true;
    };

    const copySubscription = () => {
      if (!userPlan.value.subscribeUrl) {
        showToast(t('dashboard.noSubscription'), 'error', 3000);
        return;
      }

      // 检查订阅是否过期
      if (isExpired.value) {
        showToast(t('dashboard.subscriptionExpiredDesc'), 'error', 4000);
        return;
      }

      const copyWithAPI = () => {
        navigator.clipboard.writeText(userPlan.value.subscribeUrl)
            .then(() => {
              showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
            })
            .catch(() => {
              showToast(t('dashboard.copyFailed'), 'error', 3000);
            });
      };

      const copyWithFallback = () => {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = userPlan.value.subscribeUrl;
          textarea.style.position = 'fixed';
          textarea.style.left = '0';
          textarea.style.top = '0';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (successful) {
            showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
          } else {
            showToast(t('dashboard.copyFailed'), 'error', 3000);
          }
        } catch (err) {
          console.error('使用后备方法复制失败:', err);
          showToast(t('dashboard.copyFailed'), 'error', 3000);
        }
      };

      if (navigator.clipboard) {
        copyWithAPI();
      } else {
        copyWithFallback();
      }
    };

    const importToClient = (clientType) => {
      if (!userPlan.value.subscribeUrl) {
        showToast(t('dashboard.noSubscription'), 'error', 3000);
        return;
      }

      // 检查订阅是否过期
      if (isExpired.value) {
        showToast(t('dashboard.subscriptionExpiredDesc'), 'error', 4000);
        return;
      }

      const subscribeUrl = userPlan.value.subscribeUrl;
      const siteName = SITE_CONFIG.siteName || '订阅';

      let url = '';
      let shouldUseCurrentWindow = true;

      try {
        switch (clientType) {
          case 'shadowrocket':
            url = `shadowrocket://add/sub://${window.btoa(subscribeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}?remark=${encodeURIComponent(siteName)}`;
            break;
          case 'surge':
          case 'surge-mac':
            url = `surge:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'stash':
          case 'stash-mac':
            url = `stash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'quantumultx':
          case 'quantumultx-mac':
            url = `quantumult-x:///update-configuration?remote-resource=${encodeURI(JSON.stringify({server_remote: [`${subscribeUrl}, tag=${encodeURIComponent(siteName)}`,],}))}`;
            break;
          case 'loon':
            url = `loon://import?nodelist=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'v2rayng':
            url = `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'clash':
          case 'clash-android':
          case 'clash-meta-android':
          case 'flclash':
          case 'clashverge':
          case 'nekobox':
          case 'nekoray':
          case 'clashx':
          case 'clashx-meta':
            url = `clash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'surfboard':
            url = `surfboard:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'singbox-ios':
          case 'singbox-android':
          case 'singbox-windows':
          case 'singbox-macos':
            url = `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'hiddify-android':
          case 'hiddify-windows':
          case 'hiddify-macos':
          case 'hiddify-ios':
            url = `hiddify://import/${subscribeUrl}#${encodeURIComponent(siteName)}`;
            break;
          default:
            navigator.clipboard.writeText(subscribeUrl)
              .then(() => {
                showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
              })
              .catch(() => {
                showToast(t('dashboard.copyFailed'), 'error', 3000);
              });
            return;
        }

        if (url) {
          if (shouldUseCurrentWindow) {
            window.location.href = url;
          } else {
            window.open(url, '_blank');
          }
        }
      } catch (error) {
        console.error('导入客户端失败:', error);
      }
    };

    const goToSupport = () => {
      if (window.innerWidth < 905) {
        router.push('/mobile/tickets');
      } else {
        router.push('/tickets');
      }
    };

    const toggleImportCard = () => {
      showImportCard.value = !showImportCard.value;
      if (showImportCard.value) {
        nextTick(() => {
          setTimeout(() => {
            const importCard = document.querySelector('.import-card');
            if (importCard) {
              importCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 100);
        });
      }
    };

    const fetchUserConfig = async () => {
      try {
        const response = await getUserConfig();
        if (response.data) {
          if (response.data.currency_symbol) {
            currencySymbol.value = response.data.currency_symbol;
            if (userStats.accountBalance) {
              updateAccountBalanceDisplay();
            }
          }
        }
      } catch (error) {
        console.error('获取用户配置失败:', error);
      }
    };

    const updateAccountBalanceDisplay = () => {
      if (userBalance.value) {
        userStats.accountBalance = `${currencySymbol.value}${(parseFloat(userBalance.value) / 100).toFixed(2)}`;
      }
    };

    onMounted(async () => {
      await fetchUserConfig();

      fetchUserInfo();

      fetchSubscribe();

      fetchNotices();

      fetchUserStats();

      fetchCommissionBalance();

      updateQRCodeUrl();

      // 启动公告轮播
      startAutoRotateNotices();

      // 添加窗口大小改变监听
      window.addEventListener('resize', handleResize);
    });

    watch(() => userPlan.value.subscribeUrl, () => {
      updateQRCodeUrl();
    });

    const processedNoticeContent = computed(() => {
      if (!notices.value?.data?.[currentNoticeIndex.value]?.content) {
        return '';
      }

      const content = notices.value.data[currentNoticeIndex.value].content;

      const hasHtml = /<[a-z][\s\S]*>/i.test(content);

      if (hasHtml) {
        let processedContent = content.replace(/\n/g, '<br>');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;

        const buttons = tempDiv.querySelectorAll('button, a');
        buttons.forEach(button => {
          if (button.className && button.className.includes('eztheme-btn')) {
            button.classList.remove('markdown-link');
            button.style.textDecoration = 'none';
            button.style.borderBottom = 'none';
            button.setAttribute('data-no-markdown-style', 'true');
          }

          if (button.tagName.toLowerCase() === 'a') {
            const href = button.getAttribute('href');
            if (href && (href.includes('#eztheme-btn') || href.includes('?eztheme-btn') || href.includes('class=eztheme-btn'))) {
              button.href = href
                  .replace('#eztheme-btn', '')
                  .replace('?eztheme-btn', '')
                  .replace('class=eztheme-btn', '');
              button.classList.add('eztheme-btn');
              button.style.textDecoration = 'none';
              button.style.borderBottom = 'none';
              button.setAttribute('data-no-markdown-style', 'true');
            }
          }
        });

        return tempDiv.innerHTML;
      } else {
        return md.render(content);
      }
    });

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const noticeModalStyle = ref({});

    const updateModalHeight = () => {
      const isMobile = windowWidth.value <= 768;
      const availableHeight = windowHeight.value * (isMobile ? 0.75 : 0.8);

      noticeModalStyle.value = {
        maxHeight: `${availableHeight}px`
      };
    };

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
      windowHeight.value = window.innerHeight;
      if (showNoticeDetails.value) {
        updateModalHeight();
      }
    };

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });

    const renewPlan = () => {
      if (!userPlanId.value) {
        showToast(t('dashboard.noPlanToRenew'), 'error', 3000);
        return;
      }

      // 判断是否为试用套餐 (ID=1)
      if (userPlanId.value === 1) {
        showToast(t('dashboard.trialPlanNotRenewableDesc'), 'warning', 4000);
        // 延迟跳转到商店页面
        setTimeout(() => {
          router.push('/shop');
        }, 1000);
        return;
      }

      router.push(`/order-confirm?id=${userPlanId.value}`);
    };

    const isXiaoPanel = isXiaoV2board();

    const navigateToDeposit = () => {
      router.push('/wallet/deposit');
    };

    const showDeviceLimit = computed(() => {
      return isXiaoV2board() && DASHBOARD_CONFIG.showOnlineDevicesLimit;
    });

    const timers = {};
    const listeners = {};

    const startAutoRotateNotices = () => {
      if (!autoRotateNotices.value) return;

      createTimer(timers, 'noticeRotation', () => {
        if (notices.value && notices.value.data && notices.value.data.length > 1) {
          nextNotice();
        }
      }, 8000, true);
    };

    onActivated(() => {
      console.log('Dashboard组件被激活');
      if (needRefreshData.value) {
        fetchUserInfo();
        fetchUserStats();
        fetchNotices();
        needRefreshData.value = false;
      }

      startAutoRotateNotices();
    });

    onDeactivated(() => {
      console.log('Dashboard组件被停用');
      needRefreshData.value = true;

      cleanupResources(timers, listeners);
    });

    onUnmounted(() => {
      cleanupResources(timers, listeners);
    });

    const needRefreshData = ref(false);

    const trafficPercentage = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!userPlan.value || !userPlan.value.totalTraffic || !remainingMatch) return 0;

      const totalMatch = userPlan.value.totalTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);
      if (!totalMatch) return 0;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      const totalValue = parseFloat(totalMatch[1]);
      const totalUnit = totalMatch[3].toUpperCase();

      const unitToBytes = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };

      const remainingBytes = remainingValue * unitToBytes[remainingUnit];
      const totalBytes = totalValue * unitToBytes[totalUnit];

      if (totalBytes === 0) return 0;

      return Math.min(Math.max(Math.round((remainingBytes / totalBytes) * 100), 0), 100);
    });

    return {
      userStats,
      userBalance,
      currencySymbol,
      userPlan,
      clientConfig,
      notices,
      loading,
      languageChangedSignal,
      goToShop,
      openDocumentation,
      downloadClient,
      hasPendingItems,
      router,
      currentNoticeIndex,
      prevNotice,
      nextNotice,
      goToNotice,
      toggleAutoRotate,
      autoRotateNotices,
      showImportCard,
      showQrCode,
      importToClient,
      goToSupport,
      formatDate,
      formatTraffic,
      toggleImportCard,
      copySubscription,
      platforms,
      activePlatform,
      qrCodeUrl,
      qrCodeLoading,
      qrCodeLoaded,
      handleShowQrCode,
      showNoticeModal,
      closeNoticeModal,
      showNoticeDetails,
      checkForPopupNotices,
      noticeModalStyle,
      openResetTrafficModal,
      popupConfig,
      handlePopupClose,
      handlePopupConfirm,
      showPopup,
      closeResetTrafficModal,
      createResetTrafficOrder,
      showResetTrafficModal,
      resetConfirmCooldown,
      showResetTrafficButton,
      isCreatingResetOrder,
      hasIOSClients,
      hasAndroidClients,
      hasWindowsClients,
      hasMacOSClients,
      shadowrocketIcon,
      surgeIcon,
      stashIcon,
      quantumultIcon,
      singboxIcon,
      loonIcon,
      v2rayNGIcon,
      clashAndroidIcon,
      surfboardIcon,
      clashMetaAndroidIcon,
      nekoboxIcon,
      singboxAndroidIcon,
      hiddifyAndroidIcon,
      flclashIcon,
      clashvergeIcon,
      clashWindowsIcon,
      nekorayIcon,
      singboxWindowsIcon,
      hiddifyWindowsIcon,
      clashXIcon,
      clashMetaXIcon,
      surgeMacIcon,
      stashMacIcon,
      quantumultXMacIcon,
      singboxMacIcon,
      hiddifyMacIcon,
      isExpiringSoon,
      isExpired,
      isLowTraffic,
      isTrafficDepleted,
      isTrialPlan,
      isTrialInvalid,
      isNormalPlan,
      isLongTermPlan,
      isTrafficOver80,
      hasPlan,
      processedNoticeContent,
      showRenewPlanButton,
      renewPlan,
      isXiaoPanel,
      navigateToDeposit,
      showDeviceLimit,
      needRefreshData,
      trafficPercentage,
      waterAnimationState,
      DASHBOARD_CONFIG,
      allowNewPeriod,
      showImportSubscription,
    };
  }
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(var(--theme-color-rgb), 0.02) 0%, transparent 50%);

  .dashboard-inner {
    width: 100%;
    max-width: 1200px;
  }

  // ===== 动画 =====
  .card-animate {
    animation: cardSlideUp 0.5s ease-out;
  }

  @keyframes cardSlideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // ===== Hero Section - 英雄区 =====
  .hero-section {
    background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(var(--theme-color-rgb), 0.08) 100%);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    border: 1px solid rgba(var(--theme-color-rgb), 0.15);
    position: relative;
    overflow: hidden;

    .hero-content {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .hero-welcome {
      flex: 1;
      min-width: 280px;
      
      .hero-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
        background: linear-gradient(135deg, var(--text-color) 0%, var(--theme-color) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;

        .emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif !important;
          background: none !important;
          background-clip: border-box !important;
          -webkit-background-clip: border-box !important;
          -webkit-text-fill-color: initial !important;
          color: initial !important;
          font-style: normal;
          display: inline-block;
        }
      }

      .hero-desc {
        font-size: 15px;
        color: var(--secondary-text-color);
        margin: 0;
      }

      .hero-email {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        font-size: 14px;
        color: var(--secondary-text-color);
        opacity: 0.8;
      }
    }

    .hero-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .hero-stat-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: var(--card-bg-color);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      min-width: 180px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), 0.15);
      }

      &.clickable {
        cursor: pointer;
      }

      &.stat-warning {
        border-color: #ff9800;
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, transparent 100%);
        
        .stat-circle .circle-fill { stroke: #ff9800; }
        .stat-icon { color: #ff9800; }
      }

      &.stat-danger {
        border-color: #f44336;
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, transparent 100%);
        
        .stat-circle .circle-fill { stroke: #f44336; }
        .stat-icon { color: #f44336; }
      }

      .stat-circle {
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;

        // 佣金特殊颜色
        &.commission {
          background: linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%);
          border-radius: 12px;

          .stat-icon {
            color: #9c27b0;
          }
        }

        .circular-chart {
          width: 100%;
          height: 100%;
          position: absolute;
        }

        .circle-bg {
          fill: none;
          stroke: rgba(var(--theme-color-rgb), 0.15);
          stroke-width: 3;
        }

        .circle-fill {
          fill: none;
          stroke: var(--theme-color);
          stroke-width: 3;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dasharray 0.6s ease;
        }

        .stat-icon {
          color: var(--theme-color);
          z-index: 1;

          &.solo {
            position: static;
          }
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-color);
        }

        .stat-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 2px;
        }
      }
    }

    .hero-decoration {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
      overflow: hidden;

      .deco-shape {
        position: absolute;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.1) 0%, transparent 70%);

        &.shape-1 {
          width: 300px;
          height: 300px;
          top: -150px;
          right: -100px;
        }

        &.shape-2 {
          width: 200px;
          height: 200px;
          bottom: -100px;
          left: 10%;
        }

        &.shape-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          right: 30%;
        }
      }
    }
  }

  // ===== 主内容网格布局 =====
  .main-content-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .left-column, .right-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  // ===== 待处理事项横条 =====
  .pending-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    .pending-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 152, 0, 0.05) 100%);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 10px;
      color: #ff9800;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 152, 0, 0.1) 100%);
        transform: translateX(4px);
      }
    }
  }

  // ===== 套餐卡片 =====
  .plan-card {
    background: var(--card-bg-color);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 24px;
    transition: all 0.3s ease;

    &.clickable {
      cursor: pointer;
    }

    &:hover {
      border-color: rgba(var(--theme-color-rgb), 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);

      .plan-name-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color);

        svg {
          color: var(--theme-color);
        }
      }

      .plan-status {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
        color: #4caf50;
        border: 1px solid rgba(76, 175, 80, 0.3);

        &.expired {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.05) 100%);
          color: #f44336;
          border-color: rgba(244, 67, 54, 0.3);
        }

        &.expiring {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%);
          color: #ff9800;
          border-color: rgba(255, 152, 0, 0.3);
        }
      }
    }

    .plan-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(var(--theme-color-rgb), 0.03);
        border-radius: 10px;

        .detail-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--secondary-text-color);

          svg {
            color: var(--theme-color);
          }
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color);
        }
      }
    }

    .plan-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;

      .btn-text-mobile {
        display: none;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 18px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--theme-color);
          color: var(--theme-color);
          background: rgba(var(--theme-color-rgb), 0.05);
        }

        &.primary {
          background: var(--theme-color);
          border-color: var(--theme-color);
          color: #fff;

          &:hover {
            background: rgba(var(--theme-color-rgb), 0.9);
          }

          &.btn-active {
            background: rgba(var(--theme-color-rgb), 0.2);
            color: var(--theme-color);
          }
        }

        &.warning {
          border-color: #ff9800;
          color: #ff9800;

          &:hover {
            background: rgba(255, 152, 0, 0.1);
          }
        }

        &.danger {
          border-color: #f44336;
          color: #f44336;

          &:hover {
            background: rgba(244, 67, 54, 0.1);
          }
        }

        // 工单支持按钮特殊样式
        &.support-btn {
          border-color: rgba(var(--theme-color-rgb), 0.3);
          color: var(--theme-color);
          background: rgba(var(--theme-color-rgb), 0.05);
        }
      }
    }
  }

  // ===== 无套餐卡片 =====
  .no-plan-card {
    background: var(--card-bg-color);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 48px 32px;
    text-align: center;

    .no-plan-visual {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;

      .pulse-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(var(--theme-color-rgb), 0.3);
        animation: pulseRing 2s ease-out infinite;

        &.delay-1 { animation-delay: 0.5s; }
        &.delay-2 { animation-delay: 1s; }
      }

      .rocket-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--theme-color);
      }
    }

    @keyframes pulseRing {
      0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }

    .no-plan-text {
      margin-bottom: 28px;

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-color);
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin: 0;
      }
    }

    .no-plan-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;

      .cta-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &.primary {
          background: linear-gradient(135deg, var(--theme-color) 0%, rgba(var(--theme-color-rgb), 0.8) 100%);
          border: none;
          color: #fff;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), 0.3);
          }
        }

        &.secondary {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-color);

          &:hover {
            border-color: var(--theme-color);
            color: var(--theme-color);
          }
        }
      }
    }
  }

  // ===== 导入订阅面板 =====
  .import-panel {
    background: var(--card-bg-color);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 24px;

    .import-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: rgba(var(--theme-color-rgb), 0.1);
        color: var(--text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(244, 67, 54, 0.1);
          color: #f44336;
        }
      }
    }

    // 订阅链接显示框
    .subscribe-url-box {
      margin-bottom: 20px;
      
      .url-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }

      .url-input-wrap {
        position: relative;
      }

      .url-input {
        width: 100%;
        padding: 12px 14px;
        background: rgba(var(--theme-color-rgb), 0.03);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        font-size: 13px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: var(--text-color);
        outline: none;
        transition: all 0.3s ease;
        box-sizing: border-box;

        &:focus {
          border-color: var(--theme-color);
          background: rgba(var(--theme-color-rgb), 0.05);
        }
      }

      .url-hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 8px 0 0 0;
        opacity: 0.8;
      }
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;

      .quick-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px;
        background: rgba(var(--theme-color-rgb), 0.08);
        border: 1px solid rgba(var(--theme-color-rgb), 0.2);
        border-radius: 12px;
        color: var(--theme-color);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(var(--theme-color-rgb), 0.15);
          transform: translateY(-2px);
        }
      }
    }

    .platform-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .platform-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
        cursor: pointer;
        transition: all 0.3s ease;

        svg {
          color: inherit;
          transition: color 0.3s ease;
        }

        &:hover {
          border-color: var(--theme-color);
          color: var(--theme-color);
        }

        &.active {
          background: var(--theme-color);
          border-color: var(--theme-color);
          color: #fff;

          svg {
            color: #fff;
          }
        }
      }
    }

    .platform-section {
      .platform-options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;

        .platform-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: rgba(var(--theme-color-rgb), 0.03);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(var(--theme-color-rgb), 0.08);
            border-color: rgba(var(--theme-color-rgb), 0.2);
            transform: translateY(-2px);
          }

          .client-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          span {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-color);
          }
        }
      }

      .no-clients-message {
        padding: 24px;
        text-align: center;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
    }
  }

  // ===== 右栏公告紧凑版 =====
  .notice-compact {
    background: var(--card-bg-color);
    border-radius: 14px;
    border: 1px solid var(--border-color);
    overflow: hidden;

    .notice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: rgba(var(--theme-color-rgb), 0.05);
      border-bottom: 1px solid var(--border-color);

      .notice-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color);

        svg {
          color: var(--theme-color);
        }
      }

      .notice-nav-mini {
        display: flex;
        align-items: center;
        gap: 8px;

        button {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: none;
          background: rgba(var(--theme-color-rgb), 0.1);
          color: var(--theme-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;

          &:hover:not(:disabled) {
            background: var(--theme-color);
            color: #fff;
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }

        .notice-count {
          font-size: 12px;
          color: var(--secondary-text-color);
          min-width: 32px;
          text-align: center;
        }
      }
    }

    .notice-body {
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(var(--theme-color-rgb), 0.03);
      }

      .notice-text {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        strong {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notice-date {
          font-size: 12px;
          color: var(--secondary-text-color);
          white-space: nowrap;
        }
      }
    }
  }

  // ===== 下载区域紧凑版 =====
  .download-compact {
    background: var(--card-bg-color);
    border-radius: 14px;
    border: 1px solid var(--border-color);
    padding: 16px;

    .download-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 14px;

      svg {
        color: var(--theme-color);
      }
    }

    .download-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      .download-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 14px 8px;
        background: rgba(var(--theme-color-rgb), 0.04);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;

        svg {
          color: var(--theme-color);
        }

        span {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-color);
        }

        &:hover {
          background: rgba(var(--theme-color-rgb), 0.12);
          transform: translateY(-2px);
        }
      }
    }
  }

  // ===== 过渡动画 =====
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s ease;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.25s ease;
  }

  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  // ===== 响应式 =====
  
  // 移动端公告 - 默认隐藏
  .mobile-notice {
    display: none;
  }

  // 桌面端显示控制
  .desktop-only {
    display: block;
  }

  @media (max-width: 900px) {
    // 移动端显示公告
    .mobile-notice {
      display: block;
      background: var(--card-bg-color);
      border-radius: 14px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      margin-bottom: 20px;

      .notice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        background: rgba(var(--theme-color-rgb), 0.05);
        border-bottom: 1px solid var(--border-color);

        .notice-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color);

          svg {
            color: var(--theme-color);
          }
        }

        .notice-nav-mini {
          display: flex;
          align-items: center;
          gap: 8px;

          button {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: none;
            background: rgba(var(--theme-color-rgb), 0.1);
            color: var(--theme-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background: var(--theme-color);
              color: #fff;
            }

            &:disabled {
              opacity: 0.4;
              cursor: not-allowed;
            }
          }

          .notice-count {
            font-size: 12px;
            color: var(--secondary-text-color);
            min-width: 32px;
            text-align: center;
          }
        }
      }

      .notice-body {
        padding: 14px 16px;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(var(--theme-color-rgb), 0.03);
        }

        .notice-text {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          strong {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-color);
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .notice-date {
            font-size: 12px;
            color: var(--secondary-text-color);
            white-space: nowrap;
          }
        }
      }
    }

    // 桌面端公告在移动端隐藏
    .desktop-only {
      display: none !important;
    }

    // 右栏在移动端变为客户端下载区
    .right-column {
      order: 2;
    }

    .left-column {
      order: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .hero-section {
      padding: 24px 20px;

      .hero-welcome .hero-title {
        font-size: 22px;
      }

      .hero-stats {
        width: 100%;
        justify-content: center;
      }

      .hero-stat-item {
        min-width: 140px;
        flex: 1;
        padding: 12px 14px;

        .stat-info {
          .stat-value {
            font-size: 15px;
          }
          .stat-label {
            font-size: 11px;
          }
        }
      }
    }

    .plan-card {
      padding: 20px;

      .plan-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 10px;

        .plan-name-badge {
          flex: 1;
          min-width: 0;
          
          span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .plan-status {
          padding: 4px 10px;
          font-size: 11px;
          border-radius: 16px;
          width: auto;
          flex-shrink: 0;
          text-align: center;
          font-weight: 600;
          
          // 正常状态 - 绿色
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
          
          &.expired {
            background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.05) 100%);
            color: #f44336;
            border-color: rgba(244, 67, 54, 0.3);
          }

          &.expiring {
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%);
            color: #ff9800;
            border-color: rgba(255, 152, 0, 0.3);
          }
        }
      }

      .plan-details {
        grid-template-columns: 1fr;
      }

      .plan-actions {
        flex-direction: column;
        gap: 12px;

        // 移动端显示按钮文字
        .btn-text-mobile {
          display: inline;
        }

        .action-btn {
          justify-content: center;
          width: 100%;
          padding: 14px 18px;

          // 工单支持按钮在移动端更突出 - 绿色边框
          &.support-btn {
            background: rgba(76, 175, 80, 0.08);
            border: 2px solid #4caf50;
            color: #4caf50;
            font-weight: 600;

            &:hover {
              background: rgba(76, 175, 80, 0.15);
            }
          }
        }
      }
    }

    .no-plan-card {
      padding: 32px 20px;

      .no-plan-actions {
        flex-direction: column;
        width: 100%;

        .cta-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }

    .import-panel {
      padding: 20px;

      .quick-actions {
        flex-direction: column;

        .quick-btn {
          width: 100%;
        }
      }

      .platform-selector {
        justify-content: center;
      }
    }
  }

  @media (max-width: 480px) {
    padding: 12px;

    .hero-section {
      padding: 20px 16px;
      border-radius: 16px;

      .hero-welcome {
        .hero-title {
          font-size: 20px;
        }
        .hero-desc {
          font-size: 13px;
        }
      }

      .hero-stats {
        flex-direction: column;
        gap: 12px;

        .hero-stat-item {
          width: 100%;
          min-width: unset;
        }
      }
    }

    .mobile-notice {
      border-radius: 12px;

      .notice-header {
        padding: 12px 14px;
      }

      .notice-body {
        padding: 12px 14px;

        .notice-text {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;

          strong {
            white-space: normal;
            line-height: 1.4;
          }
        }
      }
    }

    .plan-card {
      border-radius: 14px;
      padding: 16px;

      .plan-header {
        padding-bottom: 12px;
        margin-bottom: 16px;

        .plan-name-badge {
          font-size: 16px;
        }
      }

      .plan-details .detail-row {
        padding: 10px 12px;
        font-size: 13px;
      }

      .plan-actions .action-btn {
        padding: 10px 14px;
        font-size: 13px;
      }
    }

    .download-compact {
      border-radius: 12px;
      padding: 14px;

      .download-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .download-item {
          padding: 12px 6px;

          svg {
            width: 22px;
            height: 22px;
          }

          span {
            font-size: 10px;
          }
        }
      }
    }

    .pending-bar {
      flex-direction: column;
      
      .pending-tag {
        width: 100%;
        justify-content: space-between;
      }
    }
  }

  .welcome-card {
    margin-bottom: 24px;

    .user-email {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid rgba(var(--theme-color-rgb), 0.1);
      color: var(--secondary-text-color);
      font-size: 14px;
    }
  }

  .dashboard-card {
    background-color: var(--card-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      border-color: rgba(var(--theme-color-rgb), 0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .card-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .card-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .subscription-card {
    margin-bottom: 24px;

    .subscription-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 15px;

      .info-item {
        display: flex;
        flex-direction: column;

        .info-label {
          font-size: 13px;
          color: var(--secondary-text-color);
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color);
        }
      }
    }

    // 新增网格布局样式
    .subscription-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .info-grid-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.05) 0%, rgba(var(--theme-color-rgb), 0.02) 100%);
        border-radius: 10px;
        border: 1px solid rgba(var(--theme-color-rgb), 0.1);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.08) 0%, rgba(var(--theme-color-rgb), 0.04) 100%);
          border-color: rgba(var(--theme-color-rgb), 0.2);
          transform: translateY(-2px);
        }

        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--theme-color) 0%, rgba(var(--theme-color-rgb), 0.8) 100%);
          color: #fff;
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          min-width: 0;

          .info-label {
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
          }

          .info-value {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      @media (max-width: 576px) {
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .info-grid-item {
          padding: 12px;
          
          .info-icon {
            width: 36px;
            height: 36px;
          }

          .info-content {
            .info-value {
              font-size: 14px;
            }
          }
        }
      }

      @media (max-width: 400px) {
        grid-template-columns: 1fr;
      }
    }

    .subscription-actions {
      display: flex;
      gap: 12px;
      margin-top: 15px;

      @media (min-width: 769px) {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 16px;

        .action-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          
          &.primary-actions {
            padding-right: 16px;
            border-right: 1px solid var(--border-color);
          }
        }

        button {
          flex: 0 0 auto;
          min-width: 120px;
        }
      }

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 12px;

        .action-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          
          &.primary-actions {
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
          }
        }

        button {
          width: 100%;
        }
      }

      .reset-traffic-btn {
        position: relative;
        overflow: hidden;

        &.reset-warning {
          color: #ff9800;
          border-color: #ff9800;
          background-color: rgba(255, 152, 0, 0.1);
        }

        &.reset-danger {
          color: #f44336;
          border-color: #f44336;
          background-color: rgba(244, 67, 54, 0.1);
        }
      }

      .renew-plan-btn {
        position: relative;
        overflow: hidden;

        &.renew-warning {
          color: #ff9800;
          border-color: #ff9800;
          background-color: rgba(255, 152, 0, 0.1);
        }

        &.renew-danger {
          color: #f44336;
          border-color: #f44336;
          background-color: rgba(244, 67, 54, 0.1);
        }
      }
      
      .btn-primary-action {
        font-weight: 500;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: repeat(4, 1fr);
    }

    .stats-card {
      position: relative;
      background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(var(--theme-color-rgb), 0.03) 100%);
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      border: 1px solid var(--border-color);

      // 装饰性背景圆
      &::before {
        content: '';
        position: absolute;
        top: -30px;
        right: -30px;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.1) 0%, rgba(var(--theme-color-rgb), 0.02) 100%);
        z-index: 0;
      }

      .water-container {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }

      .water-progress {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: rgba(var(--theme-color-rgb), 0.12);
        transition: none;
        border-radius: 0 0 16px 16px;
        height: 0;

        &.animate-water {
          transition: height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        &:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
      }

      .stats-icon, .stats-info {
        position: relative;
        z-index: 1;
      }

      &.warning-card {
        background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 152, 0, 0.05) 100%);
        border-color: rgba(255, 152, 0, 0.2);
        
        &::before {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.02) 100%);
        }
        
        .water-progress {
          background-color: rgba(255, 152, 0, 0.15);
        }

        .stats-icon {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 152, 0, 0.1) 100%);
          color: #ff9800;
        }
      }

      &.danger-card {
        background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(244, 67, 54, 0.05) 100%);
        border-color: rgba(244, 67, 54, 0.2);
        
        &::before {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.02) 100%);
        }
        
        .water-progress {
          background-color: rgba(244, 67, 54, 0.15);
        }

        .stats-icon {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%);
          color: #f44336;
        }
      }

      @keyframes wave {
        0% {
          transform: translateX(0) translateZ(0);
        }
        100% {
          transform: translateX(-50%) translateZ(0);
        }
      }

      &:hover {
        border-color: rgba(var(--theme-color-rgb), 0.3);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateY(-3px);
      }

      .stats-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15) 0%, rgba(var(--theme-color-rgb), 0.08) 100%);
        border-radius: 14px;
        margin-right: 15px;
        color: var(--theme-color);
      }

      .stats-info {
        flex: 1;

        .stats-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color);
          margin-bottom: 5px;
        }

        .stats-label {
          font-size: 14px;
          color: var(--secondary-text-color);
        }
      }

      .chevron-icon {
        color: var(--theme-color);
        opacity: 0.5;
        transition: all 0.3s ease;
      }

      &:hover {
        .chevron-icon {
          transform: translateX(3px);
          opacity: 1;
        }
      }
    }
  }


  .download-card {
    .download-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 20px;

      @media (min-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (min-width: 992px) {
        grid-template-columns: repeat(6, 1fr);
      }

      .download-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 15px;
        border-radius: 10px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.05);
          transform: translateY(-2px);
        }

        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin-bottom: 12px;

          &.ios {
            background-color: rgba(0, 122, 255, 0.1);
            color: #007aff;
          }

          &.android {
            background-color: rgba(61, 178, 74, 0.1);
            color: #3db24a;
          }

          &.macos {
            background-color: rgba(90, 90, 90, 0.1);
            color: #5a5a5a;
          }

          &.windows {
            background-color: rgba(0, 120, 215, 0.1);
            color: #0078d7;
          }

          &.linux {
            background-color: rgba(243, 123, 29, 0.1);
            color: #f37b1d;
          }

          &.openwrt {
            background-color: rgba(0, 136, 204, 0.1);
            color: #0088cc;
          }
        }

        .option-name {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }


  .notice-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .notice-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .notice-counter {
        font-size: 14px;
        color: var(--secondary-text-color);
      }

      .carousel-control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background-color: rgba(var(--theme-color-rgb), 0.1);
        color: var(--theme-color);
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.2);
          transform: scale(1.05);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .notice-item {
      position: relative;
      padding: 16px;
      border-radius: 8px;
      background-color: rgba(var(--theme-color-rgb), 0.05);

      .notice-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-color);
      }

      .notice-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .notice-date {
          font-size: 12px;
          color: var(--secondary-text-color);
          opacity: 0.7;
        }

        .notice-nav {
          display: flex;
          gap: 8px;

          .btn-notice {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 13px;
            background-color: rgba(var(--theme-color-rgb), 0.1);
            color: var(--theme-color);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background-color: rgba(var(--theme-color-rgb), 0.2);
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }

        @media (max-width: 576px) {
          flex-direction: column;
          align-items: flex-start;

          .notice-nav {
            width: 100%;

            .btn-notice {
              flex: 1;
              justify-content: center;
              padding: 8px;
            }
          }
        }

        @media (max-width: 470px) {
          .notice-nav {
            display: grid;
            grid-template-rows: auto auto;
            gap: 8px;
            width: 100%;

            .btn-notice:nth-child(2) {
              grid-row: 1;
              grid-column: 1 / span 2;
            }

            .btn-notice:nth-child(1),
            .btn-notice:nth-child(3) {
              grid-row: 2;
            }

            .btn-notice:nth-child(1) {
              grid-column: 1;
            }

            .btn-notice:nth-child(3) {
              grid-column: 2;
            }

            .btn-notice {
              margin: 0;
              width: 100%;
            }
          }
        }
      }
    }

    // 轮播指示点样式
    .carousel-indicators {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(var(--theme-color-rgb), 0.1);

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: rgba(var(--theme-color-rgb), 0.3);
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.5);
          transform: scale(1.2);
        }

        &.active {
          width: 24px;
          border-radius: 4px;
          background-color: var(--theme-color);
        }
      }
    }
  }


  .pending-items-card {
    margin-bottom: 24px;

    .pending-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pending-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-radius: 10px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.1);
        transform: translateY(-2px);
      }

      .pending-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background-color: rgba(var(--theme-color-rgb), 0.15);
        color: var(--theme-color);
        margin-right: 15px;
      }

      .pending-info {
        flex: 1;
        font-weight: 500;
      }

      .pending-action {
        color: var(--secondary-text-color);
        transition: transform 0.3s ease;
      }

      &:hover .pending-action {
        transform: translateX(3px);
        color: var(--theme-color);
      }
    }
  }
}


.skeleton-loading {
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}


.btn-primary, .btn-outline, .btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  .btn-icon {
    margin-right: 4px;
  }
}

.btn-primary {
  background-color: var(--theme-color);
  color: white;
  border: none;

  &:hover {
    background-color: var(--primary-color-hover);
    transform: translateY(-1px);
  }
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);

  &:hover {
    border-color: var(--theme-color);
    color: var(--theme-color);
    background-color: rgba(var(--theme-color-rgb), 0.05);
    transform: translateY(-1px);
  }


  &.btn-highlight-btnbgcolor {
    position: relative;
    overflow: hidden;
    background-color: var(--theme-color);
    color: white;
    border-color: var(--theme-color);

    &:hover {
      background-color: var(--primary-color-hover, var(--theme-color));
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.25);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0) 100%
      );
      animation: card-shimmer 3s infinite;
      transform: skewX(-25deg);
    }
  }
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.btn-action {
  background-color: transparent;
  color: var(--secondary-text-color);
  border: none;
  padding: 5px 10px;
  font-size: 13px;

  &:hover {
    color: var(--theme-color);
    background-color: rgba(var(--theme-color-rgb), 0.05);
  }

  .action-icon {
    width: 16px;
    height: 16px;
  }
}


.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}


@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
    padding-bottom: 80px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .subscription-card .subscription-info {
    flex-direction: column;
    gap: 15px;
  }

  .subscription-card .info-item {
    width: 100%;
    padding: 0;
    border-right: none;
    border-bottom: 1px solid var(--border-light-color);
    padding-bottom: 15px;
  }

  .subscription-card .info-item:last-child {
    border-bottom: none;
  }

  .subscription-actions {
    flex-direction: column;
    margin-top: 15px;
  }

  .platform-selector {
    flex-wrap: wrap;
  }

  .no-plan-content {
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .no-plan-icon {
    width: 65px;
    height: 65px;
    margin: 0 auto;
    transform: rotate(0deg);
  }

  .no-plan-icon .icon-cart {
    width: 36px;
    height: 36px;
  }

  .no-plan-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  .no-plan-title {
    font-size: 1.1rem;
    margin-bottom: 12px;
    text-align: center;
  }

  .no-plan-actions {
    justify-content: center;
    width: 100%;
    gap: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .no-plan-actions .action-button {
    padding: 8px 15px;
    min-width: 120px;
    justify-content: center;
  }

  .no-plan-actions .action-button span {
    font-size: 14px;
  }

  .no-plan-actions .action-button .btn-icon {
    width: 16px;
    height: 16px;
  }

  .stats-card.no-plan-card {
    padding: 15px 12px;
  }
}

@media (min-width: 769px) {
  .subscription-actions {
    display: flex;
    flex-direction: row;
    gap: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}


.stats-card.doc-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card.doc-card:hover {
  background-color: rgba(var(--theme-color-rgb), 0.08);
  transform: translateY(-3px);
}

.stats-card.doc-card .stats-icon {
  background-color: rgba(92, 124, 250, 0.15);
  color: #5c7cfa;
}

.stats-card.doc-card .stats-value {
  color: var(--theme-color);
}

.stats-card.doc-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.2) 50%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: card-shimmer 3s infinite;
  transform: skewX(-25deg);
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}


.btn-active {
  background-color: rgba(var(--theme-color-rgb), 0.1);
  color: var(--theme-color);
  border-color: var(--theme-color);
}


.import-card {
  margin-bottom: 24px;
  overflow: hidden;
  will-change: transform, opacity;
  transform-origin: top center;
  contain: content;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: transparent;
  border: none;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    transform: rotate(90deg);

    .close-icon::before,
    .close-icon::after {
      background-color: var(--theme-color);
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
  }

  .close-icon {
    position: relative;
    width: 20px;
    height: 20px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: var(--secondary-text-color);
      border-radius: 2px;
      top: 50%;
      left: 0;
      transition: background-color 0.2s ease;
    }

    &::before {
      transform: translateY(-50%) rotate(45deg);
    }

    &::after {
      transform: translateY(-50%) rotate(-45deg);
    }
  }
}

.import-action {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 10px;
  cursor: pointer;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    transform: translateY(-2px);
  }

  .import-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 10px;
    margin-right: 16px;
    background-color: rgba(var(--theme-color-rgb), 0.1);
    color: var(--theme-color);
  }

  .import-content {
    flex: 1;

    .import-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .import-desc {
      font-size: 13px;
      color: var(--secondary-text-color);
      word-break: break-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }
}

.copy-action .import-icon {
  background-color: rgba(25, 113, 194, 0.1);
  color: #1971c2;
}

.qrcode-action .import-icon {
  background-color: rgba(64, 192, 87, 0.1);
  color: #40c057;
}

.platform-section {
  margin-bottom: 24px;

  .platform-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);
  }

  .platform-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    .platform-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border-radius: 10px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.1);
        transform: translateY(-3px);
        border-color: var(--theme-color);
      }

      svg {
        margin-bottom: 8px;
        color: var(--theme-color);
      }

      span {
        font-size: 14px;
      }
    }
  }
}


.qrcode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.qrcode-modal {
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  width: 90%;
  max-width: 360px;
  overflow: hidden;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-color-scheme: dark) {
    background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--text-color);
    font-weight: 600;
  }
}

.qrcode-content {
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

  img {
    width: 220px;
    height: 220px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    background-color: white;
    padding: 15px;
    object-fit: cover;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
  }

  .qrcode-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;
    min-height: 220px;

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(var(--theme-color-rgb), 0.2);
      border-radius: 50%;
      border-top-color: var(--theme-color);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 15px;
    }

    p {
      font-size: 15px;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .platform-options {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .import-action {
    padding: 12px;

    .import-icon {
      width: 40px;
      height: 40px;
    }
  }
}


.platform-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  .platform-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(var(--theme-color-rgb), 0.05);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-color);

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
    }

    &.active {
      background-color: rgba(var(--theme-color-rgb), 0.15);
      color: var(--theme-color);
      border-color: var(--theme-color);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(var(--theme-color-rgb), 0.2);
    }

    svg {
      color: var(--theme-color);
      opacity: 0.8;
    }
  }
}


.client-icon {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  margin-bottom: 8px;
  object-fit: cover;
}

.platform-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 10px;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    margin-bottom: 8px;
    color: var(--theme-color);
  }

  span {
    font-size: 14px;
  }
}


.stats-card.warning-card {
  border-color: #ff9800;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.15);

  .stats-icon {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }

  .stats-value {
    color: #ff9800;
  }
}

.stats-card.danger-card {
  border-color: #f44336;
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.15);

  .stats-icon {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }

  .stats-value {
    color: #f44336;
  }
}




.skeleton-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}


.skeleton-header {
  height: 24px;
  margin-bottom: 20px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 6px;
  width: 30%;
  margin: 16px 20px;
  position: relative;
}

.skeleton-body {
  padding: 0 20px 20px;
}

.skeleton-row {
  height: 16px;
  margin-bottom: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 100%;
  position: relative;
}

.skeleton-row:last-child {
  width: 75%;
  margin-bottom: 0;
}


.dark-theme .skeleton-header,
.dark-theme .skeleton-row,
.dark-theme .skeleton-circle,
.dark-theme .skeleton-row-sm,
.dark-theme .skeleton-row-xs {
  background-color: rgba(255, 255, 255, 0.08);
}


.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
}

.skeleton-content {
  flex: 1;
  position: relative;
}

.skeleton-row-sm {
  height: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 80%;
  margin-bottom: 10px;
  position: relative;
}

.skeleton-row-xs {
  height: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 50%;
  position: relative;
}


.stats-card.skeleton-card {
  display: flex;
  align-items: center;
  padding: 16px;
  animation: none;
  background-color: var(--card-bg-color);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
  position: relative;
}

.stats-card.skeleton-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.2) 20%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
  z-index: 1;
}

.import-action .import-content .import-desc {
  color: var(--secondary-text-color);
  font-size: 12px;
  line-height: 1.4;
}

.no-clients-message {
  padding: 20px;
  text-align: center;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  border-radius: 12px;
  margin: 10px 0;
  border: 1px dashed rgba(var(--theme-color-rgb), 0.3);
}

.no-clients-message p {
  color: var(--text-color);
  font-size: 14px;
  margin: 0;
}


.platform-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  .platform-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(var(--theme-color-rgb), 0.05);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-color);

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
    }

    &.active {
      background-color: rgba(var(--theme-color-rgb), 0.15);
      color: var(--theme-color);
      border-color: var(--theme-color);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(var(--theme-color-rgb), 0.2);
    }

    svg {
      color: var(--theme-color);
      opacity: 0.8;
    }
  }
}


@media (min-width: 1200px) {
  .stats-card.no-plan-card {
    padding: 25px 30px;
  }

  .no-plan-content {
    gap: 30px;
  }

  .no-plan-title {
    font-size: 1.3rem;
  }

  .no-plan-actions .action-button {
    padding: 12px 22px;
    font-size: 16px;
  }
}


.no-plan-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-plan-actions .action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}


@media screen and (min-width: 769px) {
  .no-plan-content {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 1;
    flex-direction: row;
  }

  .no-plan-message {
    flex: 1;
    text-align: left;
    align-items: flex-start;
    width: auto;
  }

  .no-plan-title {
    text-align: left;
    width: auto;
  }

  .no-plan-subtitle {
    color: var(--secondary-text-color);
    font-size: 14px;
    margin-top: 8px;
    margin-bottom: 16px;
  }

  .no-plan-actions {
    justify-content: flex-start;
    width: auto;
    flex-direction: row;
  }

  .no-plan-actions .action-button {
    width: auto;
    max-width: none;
  }
}

// 无套餐卡片视觉装饰
.no-plan-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-decoration {
  position: absolute;
  width: 120px;
  height: 120px;
  
  .deco-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.6;
    
    &.circle-1 {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15) 0%, rgba(var(--theme-color-rgb), 0.05) 100%);
      animation: pulse-slow 3s ease-in-out infinite;
    }
    
    &.circle-2 {
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
      background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.2) 0%, rgba(var(--theme-color-rgb), 0.08) 100%);
      animation: pulse-slow 3s ease-in-out infinite 0.5s;
    }
    
    &.circle-3 {
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
      background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.25) 0%, rgba(var(--theme-color-rgb), 0.1) 100%);
      animation: pulse-slow 3s ease-in-out infinite 1s;
    }
  }
}

@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .no-plan-subtitle {
    color: var(--secondary-text-color);
    font-size: 13px;
    margin-top: 6px;
    margin-bottom: 14px;
    text-align: center;
  }
  
  .visual-decoration {
    width: 100px;
    height: 100px;
  }
}


.notice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);
}

.notice-modal {
  width: 100%;
  max-width: 500px;
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-color-scheme: dark) {
    background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);
  }
}

.notice-modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);

  .popup-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .popup-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    margin: -8px;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--text-color);
      transform: rotate(90deg);
    }
  }
}

.notice-modal-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

  .notice-content {
    font-size: 14px;
    line-height: 1.6;

    :deep(p) {
      margin: 12px 0;
      line-height: 1.6;
      color: var(--text-color);
    }

    :deep(strong) {
      color: var(--theme-color);
      font-weight: 600;
    }

    :deep(a) {
      color: var(--theme-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      border-radius: 8px;
    }

    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin-bottom: 16px;

      li {
        margin-bottom: 8px;
        list-style-position: outside;
      }
    }

    :deep(ul) li {
      list-style-type: disc;
    }

    :deep(ol) li {
      list-style-type: decimal;
    }

    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    :deep(blockquote) {
      border-left: 4px solid var(--theme-color);
      padding: 10px 15px;
      margin: 16px 0;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      border-radius: 0 6px 6px 0;

      p {
        margin: 8px 0;
      }
    }

    :deep(code) {
      font-family: monospace;
      background-color: rgba(var(--theme-color-rgb), 0.1);
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: rgba(var(--theme-color-rgb), 0.05);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;

      code {
        background-color: transparent;
        padding: 0;
      }
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;

      th, td {
        border: 1px solid var(--border-color);
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background-color: rgba(var(--theme-color-rgb), 0.05);
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: rgba(var(--theme-color-rgb), 0.02);
      }
    }

    :deep(a.eztheme-btn) {
      display: inline-block;
      padding: 8px 16px;
      background-color: var(--theme-color);
      color: white;
      border-radius: 8px;
      margin: 10px 0;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--primary-color-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(var(--theme-color-rgb), 0.3);
      }
    }
  }
}

.notice-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;

  .popup-action-btn {
    padding: 8px 20px;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;

    &.adaptive-btn {
      min-width: auto;
      padding: 8px 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background-color: var(--secondary-text-color);
    }
  }
}

.popup-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-slide-leave-active {
  transition: all 0.2s ease-out;
}

.popup-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.popup-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}


@media (max-width: 768px) {
  .notice-modal-overlay {
    padding: 15px;

    .notice-modal {
      max-width: 100%;
      max-height: 85vh;

      .notice-modal-header {
        padding: 15px;

        .popup-title {
          font-size: 16px;
        }
      }

      .notice-modal-content {
        padding: 15px;
      }

      .notice-modal-footer {
        padding: 12px 15px;
      }
    }
  }
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-card {
  background-color: var(--card-background);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reset-traffic-modal {
  .modal-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--text-color);
      }
    }
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .warning-icon {
      margin-bottom: 16px;
      color: #ff9800;
    }

    .warning-text {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 12px;
      text-align: center;
      color: var(--text-color);
    }

    .note-text {
      font-size: 14px;
      color: var(--secondary-text-color);
      text-align: center;
      margin-bottom: 0;
      padding: 8px 12px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      border-radius: 6px;
      width: 100%;
    }
  }

  .modal-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid var(--border-color);

    button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
      }
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);

      &:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .confirm-btn {
      background-color: #f44336;
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: #e53935;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
      }
    }
  }
}


.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}


.loader-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}


.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


</style>

<!-- 全局样式，不受scoped限制 -->
<style lang="scss">
@use '@/assets/styles/no-plan-card' as *;

.stats-card.warning-card {
  border-color: #ff9800 !important;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.15) !important;

  .stats-icon {
    background-color: rgba(255, 152, 0, 0.1) !important;
    color: #ff9800 !important;
  }

  .stats-value {
    color: #ff9800 !important;
  }
}

.stats-card.danger-card {
  border-color: #f44336 !important;
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.15) !important;

  .stats-icon {
    background-color: rgba(244, 67, 54, 0.1) !important;
    color: #f44336 !important;
  }

  .stats-value {
    color: #f44336 !important;
  }
}


.eztheme-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8px 16px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  background-color: rgba(var(--theme-color-rgb), 0.1) !important;
  color: var(--theme-color) !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  font-weight: 500 !important;
  margin: 8px 0 !important;
  text-decoration: none !important;
  border-bottom: none !important;
  text-align: center !important;
  box-shadow: none !important;
  border-color: transparent !important;
  width: auto !important;

  &:hover, &:active, &:focus, &:visited {
    background-color: rgba(var(--theme-color-rgb), 0.2) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.1) !important;
    border-bottom: none !important;
    text-decoration: none !important;
    color: var(--theme-color) !important;
    border-color: transparent !important;
  }

  &:active {
    transform: translateY(0) !important;
    box-shadow: none !important;
  }

  &:focus {
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.3) !important;
  }
}


a.eztheme-btn {
  background-image: none !important;
  background-repeat: no-repeat !important;
  background-position: initial !important;
  background-size: initial !important;
  text-decoration: none !important;
  border-bottom: none !important;

  &::after, &::before {
    display: none !important;
    content: none !important;
  }
}


.stats-card.balance-card.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card.balance-card.clickable:hover {
  background-color: rgba(var(--theme-color-rgb), 0.08);
  transform: translateY(-3px);
}

.stats-card.balance-card .stats-value {
  color: var(--theme-color);
}
</style>


