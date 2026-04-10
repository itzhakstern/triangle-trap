export const gameModes = [
  {
    id: 'triangles',
    label: 'משולשים',
    description: 'מחברים נקודות חופשיות וסוגרים משולשים כדי לצבור נקודות.',
    boardLabel: 'לוח חופשי',
    scoreLabel: 'משולשים',
    scoreLabelSingular: 'משולש',
    rulesText: 'כל משולש חדש מעניק נקודה ומאפשר תור נוסף.',
  },
  {
    id: 'rectangles',
    label: 'מרובעים',
    description: 'לוח רשת מסודר שבו סוגרים מרובעים בין נקודות שכנות.',
    boardLabel: 'לוח רשת',
    scoreLabel: 'מרובעים',
    scoreLabelSingular: 'מרובע',
    rulesText: 'כל מרובע חדש מעניק נקודה ומאפשר תור נוסף.',
  },
];

export const boardLayouts = [
  {id: 'random', label: 'חופשי', description: 'פיזור אקראי מאוזן בכל סיבוב.'},
  {id: 'circle', label: 'מעגל', description: 'נקודות מסודרות על טבעת ונראות מסודר יותר.'},
  {id: 'wave', label: 'גל', description: 'מבנה גלי שנותן תחושה שונה בלי להכביד על המשחק.'},
];

export const rectangleGridSizes = [
  {id: '3x3', label: '3x3', description: '9 מרובעים קטנים על לוח קומפקטי.', rows: 4, cols: 4},
  {id: '4x4', label: '4x4', description: '16 מרובעים עם איזון טוב בין עומק לקצב.', rows: 5, cols: 5},
  {id: '5x5', label: '5x5', description: '25 מרובעים למשחק ארוך ואסטרטגי יותר.', rows: 6, cols: 6},
];

export const moveTimerOptions = [
  {id: 'off', label: 'ללא הגבלה', seconds: 0},
  {id: '5', label: '5 שניות', seconds: 5},
  {id: '10', label: '10 שניות', seconds: 10},
];

export const aiDifficultyOptions = [
  {id: 'easy', label: 'קל', description: 'מהלכים אקראיים יותר ותגובה פשוטה.'},
  {id: 'medium', label: 'בינוני', description: 'מעדיף לסגור צורות אבל עדיין טועה לפעמים.'},
  {id: 'hard', label: 'קשה', description: 'מחפש ניקוד מיידי ומצמצם מהלכים חזקים ליריב.'},
];
