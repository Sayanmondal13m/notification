import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  userInfo: { alignItems: 'flex-end' },
  loggedIn: { marginBottom: 5 },
  logoutButton: { padding: 10, backgroundColor: 'red', borderRadius: 5 },
  logoutText: { color: '#fff' },
  searchSection: { flexDirection: 'row', marginBottom: 20 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, marginRight: 10, borderRadius: 5 },
  searchButton: { backgroundColor: '#00c6ff', padding: 10, borderRadius: 5 },
  searchButtonText: { color: '#fff' },
  searchResult: { marginBottom: 20 },
  addChatButton: { padding: 10, backgroundColor: 'green', borderRadius: 5, marginTop: 10 },
  addChatText: { color: '#fff' },
  chatCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  chatUser: { fontSize: 16 },
  chatButtons: { flexDirection: 'row' },
  chatButton: { padding: 10, backgroundColor: '#00c6ff', borderRadius: 5, marginRight: 10 },
  chatButtonText: { color: '#fff' },
  deleteButton: { padding: 10, backgroundColor: 'red', borderRadius: 5 },
  deleteButtonText: { color: '#fff' },
  noChats: { textAlign: 'center', color: '#999', marginTop: 20 },

  updateButton: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  
});