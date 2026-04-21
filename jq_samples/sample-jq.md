## 特定のテキストのブロックをすべて取得

.. | objects | select(.text == "LiveOps Building Blocks")

## 特定のテキストのブロックの子どもだけ取得

.. | objects | select(.text == "LiveOps Building Blocks") | .children[]

## 特定のテキストのブロックの子どもの中のさらに特定のテキストのブロックをすべて取得

.. | objects | select(.text == "LiveOps Building Blocks") | .children[] | .. | objects | select(.text == "Player Accounts Building Block") 

### 再帰的に検索しているので以下も同じ結果

.. | objects | select(.text == "Player Accounts Building Block") 

## 特定のテキストのブロックの子どもの url を再帰的に全て取得

.. | objects | select(.text == "LiveOps Building Blocks") | .children[] | .. | objects | .url