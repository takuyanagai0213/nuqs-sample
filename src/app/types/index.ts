// 承認ステータスの選択肢
export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

// デバイスの選択肢
export const DEVICES = ['DESKTOP', 'MOBILE'] as const
export type Device = (typeof DEVICES)[number]

// フィルター状態の型
export interface FilterState {
  programId: string | null
  statuses: ApprovalStatus[]
  devices: Device[]
}

// フィルター操作の型
export interface FilterActions {
  setProgramId: (value: string | null) => void
  toggleStatus: (status: ApprovalStatus) => void
  toggleDevice: (device: Device) => void
  clearFilters: () => void
}
