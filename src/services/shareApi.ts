import apiClient from './api'

export const getMysteryBoxShareInfo = () =>
  apiClient.get('/game/api/mystery_box/v1/share/info')

export const getKeralaShareInfo = () =>
  apiClient.get('/game/api/kerala/v1/share/info')

export const getDigitShareInfo = () =>
  apiClient.get('/game/api/three_digit/v1/share/info')

export const getFiveDShareInfo = () =>
  apiClient.get('/game/api/four_five_digit/v1/share/info')
