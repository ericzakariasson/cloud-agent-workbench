"use client";

import { useMemo, useState } from "react";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const HIDDEN_CARD = { id: "hidden", rank: "?", suit: "?" };

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        rank,
        suit
      });
    }
  }
  return deck;
}

function shuffleDeck(cards) {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function cardValue(rank) {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return Number(rank);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += cardValue(card.rank);
    if (card.rank === "A") aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

function dealInitialState() {
  const shuffled = shuffleDeck(buildDeck());
  const playerHand = [shuffled[0], shuffled[2]];
  const dealerHand = [shuffled[1], shuffled[3]];
  const deck = shuffled.slice(4);

  if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
    if (isBlackjack(playerHand) && isBlackjack(dealerHand)) {
      return { deck, playerHand, dealerHand, status: "push" };
    }
    if (isBlackjack(playerHand)) {
      return { deck, playerHand, dealerHand, status: "player-blackjack" };
    }
    return { deck, playerHand, dealerHand, status: "dealer-blackjack" };
  }

  return { deck, playerHand, dealerHand, status: "playing" };
}

function finishDealerTurn(playerHand, dealerHand, deck) {
  let nextDealerHand = [...dealerHand];
  let nextDeck = [...deck];

  while (handValue(nextDealerHand) < 17 && nextDeck.length > 0) {
    nextDealerHand = [...nextDealerHand, nextDeck[0]];
    nextDeck = nextDeck.slice(1);
  }

  const playerTotal = handValue(playerHand);
  const dealerTotal = handValue(nextDealerHand);

  if (dealerTotal > 21) {
    return { dealerHand: nextDealerHand, deck: nextDeck, status: "dealer-bust" };
  }
  if (dealerTotal > playerTotal) {
    return { dealerHand: nextDealerHand, deck: nextDeck, status: "dealer-win" };
  }
  if (dealerTotal < playerTotal) {
    return { dealerHand: nextDealerHand, deck: nextDeck, status: "player-win" };
  }

  return { dealerHand: nextDealerHand, deck: nextDeck, status: "push" };
}

function statusText(status, playerHand, dealerHand) {
  const playerTotal = handValue(playerHand);
  const dealerTotal = handValue(dealerHand);

  switch (status) {
    case "playing":
      return `Your total: ${playerTotal}. Hit or stand.`;
    case "player-bust":
      return `You busted with ${playerTotal}. Dealer wins.`;
    case "dealer-bust":
      return `Dealer busted with ${dealerTotal}. You win.`;
    case "player-win":
      return `You win ${playerTotal} to ${dealerTotal}.`;
    case "dealer-win":
      return `Dealer wins ${dealerTotal} to ${playerTotal}.`;
    case "player-blackjack":
      return "Blackjack. You win.";
    case "dealer-blackjack":
      return "Dealer has blackjack. You lose.";
    default:
      return "Push. It's a tie.";
  }
}

function Card({ card }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`playing-card ${isRed ? "playing-card--red" : ""}`}>
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}

export default function Home() {
  const [gameState, setGameState] = useState(() => dealInitialState());
  const { deck, playerHand, dealerHand, status } = gameState;
  const isPlaying = status === "playing";

  const visibleDealerHand = useMemo(() => {
    if (!isPlaying) return dealerHand;
    return [dealerHand[0], HIDDEN_CARD];
  }, [dealerHand, isPlaying]);

  const dealerTotal = useMemo(() => {
    if (isPlaying) return cardValue(dealerHand[0].rank);
    return handValue(dealerHand);
  }, [dealerHand, isPlaying]);

  function startNewRound() {
    setGameState(dealInitialState());
  }

  function hit() {
    if (!isPlaying || deck.length === 0) return;

    const nextPlayerHand = [...playerHand, deck[0]];
    const nextDeck = deck.slice(1);
    const nextTotal = handValue(nextPlayerHand);

    if (nextTotal > 21) {
      setGameState({
        deck: nextDeck,
        playerHand: nextPlayerHand,
        dealerHand,
        status: "player-bust"
      });
      return;
    }

    setGameState({
      deck: nextDeck,
      playerHand: nextPlayerHand,
      dealerHand,
      status: "playing"
    });
  }

  function stand() {
    if (!isPlaying) return;
    const result = finishDealerTurn(playerHand, dealerHand, deck);
    setGameState({
      deck: result.deck,
      playerHand,
      dealerHand: result.dealerHand,
      status: result.status
    });
  }

  return (
    <main className="page">
      <section className="game-shell">
        <h1>Classic Blackjack</h1>
        <p className="game-subtitle">Beat the dealer without going over 21.</p>

        <div className="table">
          <section className="hand-zone">
            <div className="hand-zone__header">
              <h2>Dealer</h2>
              <span>Total: {dealerTotal}</span>
            </div>
            <div className="hand-zone__cards">
              {visibleDealerHand.map((card, index) => (
                <Card key={`${card.id}-${index}`} card={card} />
              ))}
            </div>
          </section>

          <section className="hand-zone">
            <div className="hand-zone__header">
              <h2>You</h2>
              <span>Total: {handValue(playerHand)}</span>
            </div>
            <div className="hand-zone__cards">
              {playerHand.map((card, index) => (
                <Card key={`${card.id}-${index}`} card={card} />
              ))}
            </div>
          </section>
        </div>

        <p className="status-text" aria-live="polite">
          {statusText(status, playerHand, dealerHand)}
        </p>

        <div className="controls">
          <button type="button" onClick={hit} disabled={!isPlaying}>
            Hit
          </button>
          <button type="button" onClick={stand} disabled={!isPlaying}>
            Stand
          </button>
          <button type="button" onClick={startNewRound}>
            New Round
          </button>
        </div>
      </section>
    </main>
  );
}
