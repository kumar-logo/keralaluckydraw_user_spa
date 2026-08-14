import { formatDate } from '../../utils/date'
import { OrderHeaderCardProps } from './OrderHeaderCard'
import {
  OrderRecord,
  STATUS_TO_BE_DRAWN,
  STATUS_WON,
  STATUS_NO_WIN,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
  computeTicketStatus,
  sumAmount,
} from './orderDetailTypes'

export const computeOrderRowStatus = (type: string, order: OrderRecord): number => {
  switch (type) {
    case 'color':
      return computeTicketStatus(order.tickets ?? [])
    case 'dice':
      return computeTicketStatus(order.typeList ?? [])
    case 'dubai':
    case 'race':
      return computeTicketStatus(order.codeList ?? [])
    case 'digit':
      if (!order.wonCode || order.wonCode === '***') return STATUS_TO_BE_DRAWN
      return (order.winAmount ?? 0) > 0 ? STATUS_WON : STATUS_NO_WIN
    case 'kerala': {
      const codeList = order.codeList ?? []
      if (!codeList.length) return STATUS_TO_BE_DRAWN
      if ((order.totalPrize ?? 0) > 0) return STATUS_WON
      return codeList.every((entry) => entry.status === STATUS_TO_BE_DRAWN) ? STATUS_TO_BE_DRAWN : STATUS_NO_WIN
    }
    default:
      return order.status ?? STATUS_TO_BE_DRAWN
  }
}

const formatOptional = (value: number | string | undefined, pattern: string): string =>
  value === undefined || value === null || value === '' ? '' : formatDate(value, pattern)

const codeListTotal = (order: OrderRecord): number => sumAmount(order.codeList ?? [])

export const buildOrderRowProps = (type: string, order: OrderRecord): OrderHeaderCardProps => {
  switch (type) {
    case 'color':
      return {
        orderNo: order.orderGroup,
        status: computeTicketStatus(order.tickets ?? []),
        gameName: `Wingo-${order.tabMin || 0}Minutes`,
        cover: order.icon,
        winAmount: order.totalPrize ?? 0,
        code: order.roundNo as string,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: order.totalAmount,
        drawTime: formatOptional(order.drawSec, DATE_DAY_MONTH_TIME),
      }
    case 'dice':
      return {
        orderNo: order.orderGroup,
        status: computeTicketStatus(order.typeList ?? []),
        gameName: `K3-${order.tabMin || 0}Minutes`,
        cover: order.icon,
        winAmount: order.totalPrize ?? 0,
        code: order.roundNo as string,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: order.totalAmount,
        drawTime: formatOptional(order.drawSec, DATE_DAY_MONTH_TIME),
      }
    case 'digit':
      return {
        orderNo: order.orderGroup,
        status: computeOrderRowStatus(type, order),
        gameName: order.gameName ?? '',
        winAmount: order.winAmount ?? 0,
        code: order.orderGroup,
        cover: order.gameIcon || order.gameIconUrl,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: order.totalAmount,
        drawTime: formatOptional(order.drawTime, DATE_DAY_MONTH_TIME),
      }
    case '45d':
      return {
        orderNo: order.orderGroup,
        status: order.status ?? STATUS_TO_BE_DRAWN,
        gameName: order.gameName ?? '',
        winAmount: order.totalPrize ?? 0,
        code: order.orderGroup,
        cover: order.icon,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: order.totalAmount,
        drawTime: formatOptional(order.drawTime, DATE_DAY_MONTH_TIME),
      }
    case 'kerala':
      return {
        orderNo: order.orderGroup,
        tags: order.tags,
        status: computeOrderRowStatus(type, order),
        gameName: `${order.keralaName ?? order.gameName ?? ''}-${order.roundNo}`,
        cover: order.icon,
        winAmount: order.totalPrize ?? 0,
        code: order.orderGroup,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: codeListTotal(order),
        drawTime: formatOptional(order.drawTime, DATE_DAY_MONTH_TIME),
      }
    case 'race':
    case 'dubai':
      return {
        orderNo: order.orderGroup,
        status: computeTicketStatus(order.codeList ?? []),
        gameName: `${order.gameName ?? ''}-${order.roundNo}`,
        cover: order.icon,
        winAmount: order.totalPrize ?? 0,
        code: order.orderGroup,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: codeListTotal(order),
        drawTime: formatOptional(order.drawTime, DATE_DAY_MONTH_TIME),
      }
    default:
      return {
        orderNo: order.orderGroup,
        status: order.status ?? STATUS_TO_BE_DRAWN,
        gameName: order.gameName ?? '',
        cover: order.icon,
        winAmount: order.totalPrize ?? 0,
        code: order.orderGroup,
        betTime: formatOptional(order.createTime, DATE_DAY_MONTH_YEAR_TIME),
        totalPayment: order.totalAmount,
        drawTime: formatOptional(order.drawTime, DATE_DAY_MONTH_TIME),
      }
  }
}
