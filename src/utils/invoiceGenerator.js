/**
 * Invoice Generator - 发票/账单生成器
 * 使用浏览器原生打印功能，避免中文乱码，样式更简洁
 */

import { config } from '@/config/index.js';

/**
 * 格式化金额
 */
const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '¥0.00';
    return `¥${(amount / 100).toFixed(2)}`;
};

/**
 * 格式化日期
 */
const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * 格式化周期
 */
const formatPeriod = (period, t) => {
    const periodMap = {
        'month_price': t ? t('shop.plan.price_options.month') : '月付',
        'quarter_price': t ? t('shop.plan.price_options.quarter') : '季付',
        'half_year_price': t ? t('shop.plan.price_options.half_year') : '半年付',
        'year_price': t ? t('shop.plan.price_options.year') : '年付',
        'two_year_price': t ? t('shop.plan.price_options.two_year') : '两年付',
        'three_year_price': t ? t('shop.plan.price_options.three_year') : '三年付',
        'onetime_price': t ? t('shop.plan.price_options.onetime') : '一次性',
        'reset_price': t ? t('payment.period_types.reset_price') : '重置流量包',
        'deposit': t ? t('payment.period_types.deposit') : '充值'
    };
    return periodMap[period] || period || '-';
};

/**
 * 获取订单状态文本
 */
const getStatusText = (status, t) => {
    const statusMap = {
        0: t ? t('payment.status.pending') : '待支付',
        1: t ? t('payment.status.processing') : '开通中',
        2: t ? t('payment.status.cancelled') : '已取消',
        3: t ? t('payment.status.completed') : '已完成',
        4: t ? t('payment.status.discounted') : '已折抵'
    };
    return statusMap[status] || (t ? t('payment.status.unknown') : '未知状态');
};

/**
 * 调用浏览器打印 Invoice (支持中文，无乱码)
 * @param {Object} orderDetail - 订单详情
 * @param {Object} userInfo - 用户信息
 * @param {function} t - i18n翻译函数
 */
export const printInvoice = async (orderDetail, userInfo, t) => {
    const siteName = config.SITE_CONFIG?.siteName || 'EZ-Theme';
    const primaryColor = '#000000'; // 强制黑白，或者使用简单的深灰色 '#333'
    
    // 准备数据
    const userEmail = userInfo?.email || '-';
    const tradeNo = orderDetail.trade_no || '-';
    const invoiceDate = orderDetail.paid_at ? formatDate(orderDetail.paid_at) : formatDate(orderDetail.created_at);
    const statusText = getStatusText(orderDetail.status, t);
    
    // 费用计算
    const planName = orderDetail.plan?.name || (orderDetail.period === 'deposit' ? (t ? t('wallet.deposit.title') : '账户充值') : '-');
    const periodText = formatPeriod(orderDetail.period, t);
    
    // 金额计算逻辑：
    // 1. Subtotal (小计/原价) = 套餐原价
    // 2. Discount = 优惠金额
    // 3. Balance Used = 余额抵扣
    // 4. Order Amount = Subtotal - Discount - Balance = total_amount
    // 5. Handling Fee = 手续费
    // 6. Total = Order Amount + Handling Fee
    
    const discountAmount = orderDetail.discount_amount || 0;
    const balanceAmount = orderDetail.balance_amount || 0;
    const handlingAmount = orderDetail.handling_amount || 0;
    const orderAmount = orderDetail.total_amount || 0;
    
    // 获取套餐原价（小计）
    // 优先从套餐价格中获取，如果是充值订单则使用 total_amount + 优惠 + 余额
    let originalPrice = 0;
    if (orderDetail.plan && orderDetail.period && orderDetail.plan[orderDetail.period]) {
        // 从套餐价格获取原价
        originalPrice = Math.round(orderDetail.plan[orderDetail.period]);
    } else {
        // 充值或其他情况，反推原价
        originalPrice = orderAmount + discountAmount + balanceAmount;
    }
    
    // 最终支付总额 = 订单金额 + 手续费
    const finalTotal = orderAmount + handlingAmount;
    
    // 构建 HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${tradeNo}</title>
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
                color: #333;
                background: #525659;
                font-size: 13px;
                line-height: 1.5;
                margin: 0;
                display: flex;
                justify-content: center;
                min-height: 100vh;
            }
            .invoice-container {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto;
                background: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                box-sizing: border-box;
            }
            @media print {
                body {
                    background: none;
                    display: block;
                    min-height: auto;
                }
                .invoice-container {
                    width: 100%;
                    min-height: auto;
                    box-shadow: none;
                    margin: 0;
                    padding: 15mm 20mm;
                    page-break-inside: avoid;
                }
                .no-print {
                    display: none;
                }
                /* 强制打印背景色 */
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 20px;
                border-bottom: 2px solid #000;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #000;
            }
            .invoice-title {
                font-size: 32px;
                font-weight: bold;
                color: #000;
                text-align: right;
            }
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .info-group h3 {
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
                margin: 0 0 5px 0;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .info-group p {
                font-size: 13px;
                font-weight: 500;
                margin: 0;
                color: #000;
            }
            .info-right {
                text-align: right;
            }
            .table-container {
                margin-bottom: 30px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th {
                text-align: left;
                padding: 8px 5px;
                border-bottom: 1px solid #000;
                font-size: 11px;
                text-transform: uppercase;
                color: #000;
                letter-spacing: 0.5px;
            }
            td {
                padding: 12px 5px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
            }
            .text-right {
                text-align: right;
            }
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .totals-table {
                width: 300px;
            }
            .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
            }
            .totals-row.final {
                border-top: 1px solid #000;
                margin-top: 10px;
                padding-top: 10px;
                font-weight: bold;
                font-size: 16px;
            }
            .totals-label {
                color: #666;
            }
            .totals-value {
                color: #000;
            }
            .stamp-container {
                margin-top: 20px;
                text-align: left;
                border: 2px solid #000;
                padding: 10px 15px;
                display: inline-block;
                border-radius: 4px;
                page-break-inside: avoid;
            }
            .stamp-text {
                font-size: 18px;
                font-weight: bold;
                color: #000;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                font-size: 11px;
                color: #999;
                page-break-inside: avoid;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div class="company-name">${siteName}</div>
                <div class="invoice-title">INVOICE</div>
            </div>

            <!-- Info Section -->
            <div class="info-section">
                <!-- Bill To -->
                <div class="info-group">
                    <h3>${t ? t('invoice.bill_to') : 'BILL TO'}</h3>
                    <p>${userEmail}</p>
                </div>
                
                <!-- Invoice Details -->
                <div class="info-group info-right">
                    <div style="margin-bottom: 10px;">
                        <h3>${t ? t('invoice.invoice_no') : 'INVOICE NO'}</h3>
                        <p>${tradeNo}</p>
                    </div>
                    <div>
                        <h3>${t ? t('invoice.invoice_date') : 'DATE'}</h3>
                        <p>${invoiceDate}</p>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th width="50%">${t ? t('invoice.description') : 'DESCRIPTION'}</th>
                            <th width="20%">${t ? t('invoice.period') : 'PERIOD'}</th>
                            <th width="10%">${t ? t('invoice.qty') : 'QTY'}</th>
                            <th width="20%" class="text-right">${t ? t('invoice.amount') : 'AMOUNT'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div>${planName}</div>
                            </td>
                            <td>${periodText}</td>
                            <td>1</td>
                            <td class="text-right">${formatAmount(originalPrice)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="totals-section">
                <div class="totals-table">
                    <div class="totals-row">
                        <span class="totals-label">${t ? t('invoice.subtotal') : 'Subtotal'}</span>
                        <span class="totals-value">${formatAmount(originalPrice)}</span>
                    </div>
                    
                    ${discountAmount > 0 ? `
                    <div class="totals-row">
                        <span class="totals-label">${t ? t('invoice.discount') : 'Discount'}</span>
                        <span class="totals-value">-${formatAmount(discountAmount)}</span>
                    </div>` : ''}
                    
                    ${balanceAmount > 0 ? `
                    <div class="totals-row">
                        <span class="totals-label">${t ? t('invoice.balance_used') : 'Balance Used'}</span>
                        <span class="totals-value">-${formatAmount(balanceAmount)}</span>
                    </div>` : ''}
                    
                    ${handlingAmount > 0 ? `
                    <div class="totals-row">
                        <span class="totals-label">${t ? t('invoice.handling_fee') : 'Handling Fee'}</span>
                        <span class="totals-value">${formatAmount(handlingAmount)}</span>
                    </div>` : ''}
                    
                    <div class="totals-row final">
                        <span class="totals-label" style="color: #000;">${t ? t('invoice.total') : 'TOTAL'}</span>
                        <span class="totals-value">${formatAmount(finalTotal)}</span>
                    </div>
                </div>
            </div>

            <!-- Paid Status -->
            ${(orderDetail.status === 3 || orderDetail.status === 4) ? `
            <div class="stamp-container">
                <div class="stamp-text">${t ? t('invoice.paid_notice') : 'PAID'}</div>
                ${orderDetail.payment?.name ? `<div style="font-size: 12px; margin-top: 5px; color: #666;">${t ? t('invoice.payment_method') : 'Via'}: ${orderDetail.payment.name}</div>` : ''}
            </div>` : ''}

            <!-- Footer -->
            <div class="footer">
                <p>${t ? t('invoice.footer_text') : 'Thank you for your business!'}</p>
                <p>Generated by ${siteName}</p>
            </div>
        </div>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                    // Optional: window.history.back();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;

    // 打开新窗口打印
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close(); // 必须调用，否则某些浏览器不加载 onload
    } else {
        // 如果被拦截
        alert('请允许弹出窗口以打印发票');
    }
};

// 保持兼容性的别名导出
export const generateInvoicePDF = printInvoice;

export default {
    printInvoice,
    generateInvoicePDF
};
