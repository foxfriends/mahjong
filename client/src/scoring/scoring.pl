:- use_module(library(lists)).

% All suits
suits(pin).
suits(man).
suits(sou).
suits(wind).
suits(dragon).

% Numerical suits
numerical(pin).
numerical(man).
numerical(sou).

% The green tiles
green(dragon, hatsu).
green(sou, 2).
green(sou, 3).
green(sou, 4).
green(sou, 6).
green(sou, 8).

% Numerical tile values
tileNumber(1).
tileNumber(2).
tileNumber(3).
tileNumber(4).
tileNumber(5).
tileNumber(6).
tileNumber(7).
tileNumber(8).
tileNumber(9).

% Wind values
wind(ton).
wind(shaa).
wind(nan).
wind(pei).

% Dragon values
dragon(haku).
dragon(hatsu).
dragon(chun).

tile(A, S, V) :-
    suit(A, S),
    value(A, V).

hand(A) :- up(A).
hand(A) :- down(A).

%%%%%%
% Removes an element from the list. Fails if the element was not in the list.
remove(_, [], []) :- !, false.
remove(T, [T | R], R) :- !.
remove(T, [X | L], [X | R]) :- remove(T, L, R).

%%%%%%
% Removes all elements from a list. Fails if any of the elements were not in the list.
removeAll([], R, R) :- !.
removeAll(_, [], _) :- !, false.
removeAll([T | Ts], L, R) :- remove(T, L, L2), !, removeAll(Ts, L2, R).

% Ordered variant of removeAll... is this the only way to do this?
removeSublist([], R, R) :- !.
removeSublist(_, [], _) :- !, false.
removeSublist([T | Ts], [T | L], R) :- removeSublist(Ts, L, R).
removeSublist(Ts, [S | L], [S | R]) :- removeSublist(Ts, L, R).

%%%%%%
% All valid meldings that create a winning hand.

% Explicitly melded things are fixed.
meldings(H, [M | Ms]) :-
    melded(M),
    removeAll(M, H, H2),
    !,
    meldings(H2, Ms).
% Pongs and chows are each located.
meldings([X | H], [[X, Y, Z] | M]) :-
    removeSublist([Y, Z], H, H2),
    pong(_, _, [X, Y, Z]),
    meldings(H2, M).
meldings([X | H], [[X, Y, Z] | M]) :-
    removeSublist([Y, Z], H, H2),
    chow(_, _, [X, Y, Z]),
    meldings(H2, M).

% Valid if the last two are eyes.
meldings([X, Y], [[X, Y]]) :- eyes(_, _, [X, Y]).
% If there are no last 2, the eyes should already be in M.
meldings([], _).

%%%%%%
% Types of melds:
eyes(S, V, [A, B]) :-
    tile(A, S, V),
    tile(B, S, V),
    A \= B.
pong(S, V, [A, B, C]) :-
    tile(A, S, V),
    tile(B, S, V),
    A \= B,
    tile(C, S, V),
    C \= A,
    C \= B.
kong(S, V, [A, B, C, D]) :-
    tile(A, S, V),
    tile(B, S, V),
    A \= B,
    tile(C, S, V),
    C \= A,
    C \= B,
    tile(D, S, V),
    D \= A,
    D \= B,
    D \= C.
chow(S, V, [A, B, C]) :-
    tile(A, S, T1),
    tile(B, S, T2),
    tile(C, S, T3),
    min_list([T1, T2, T3], V),
    V1 is V + 1,
    V2 is V + 2,
    member(V1, [T1, T2, T3]),
    member(V2, [T1, T2, T3]).

%%%%%%
% Helpers for computing scores.

removeChow(_, _, [], _) :- !, false.
removeChow(S, V, [C | M], M) :- chow(S, V, C).
removeChow(S, V, [M | Ms], [M | M2]) :- removeChow(S, V, Ms, M2).

removePong(_, _, [], _) :- !, false.
removePong(S, V, [P | M], M) :- pong(S, V, P).
removePong(S, V, [M | Ms], [M | M2]) :- removePong(S, V, Ms, M2).

%%%%%%
% All tiles T which, when added to hand H, create a winning hand.
calling(H, T) :-
    tile(T, _, _),
    \+(member(T, H)),
    meldings([T | H], _).
