import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const ProfileCard = ({ user }) => {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.name ? user.name.toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{user.name || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {user.role ? user.role.toUpperCase() : 'PASSENGER'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badgeText: {
    backgroundColor: '#e8f5e9',
    color: '#00C853',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default ProfileCard;