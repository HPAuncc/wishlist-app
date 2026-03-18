import { WishlistItem } from '@/types'

export const STARTING_ELO = 1000

function getKFactor(comparisonCount: number): number {
  return comparisonCount < 10 ? 64 : 32
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function updateElo(
  winner: WishlistItem,
  loser: WishlistItem
): { newWinnerRating: number; newLoserRating: number } {
  const winnerK = getKFactor(winner.comparisonCount)
  const loserK = getKFactor(loser.comparisonCount)
  const winnerExpected = expectedScore(winner.eloRating, loser.eloRating)
  const loserExpected = expectedScore(loser.eloRating, winner.eloRating)

  return {
    newWinnerRating: Math.round(winner.eloRating + winnerK * (1 - winnerExpected)),
    newLoserRating: Math.round(loser.eloRating + loserK * (0 - loserExpected)),
  }
}
