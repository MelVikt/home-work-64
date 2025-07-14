export function applyTheme(req, res, next) {
  const validThemes = ['light', 'dark'];
  const selectedTheme = req.cookies.theme;

  res.locals.theme = validThemes.includes(selectedTheme) ? selectedTheme : 'light';
  next();
}