import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Mimics iframe background
    zIndex: 1,
  },
  card: {
    padding: 20,
    width: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    borderRadius: 10,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: '#00c6ff',
    width: '90%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    marginTop: 20,
    color: 'red',
  },
});